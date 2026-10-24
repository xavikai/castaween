"""Passa un GLB fet amb la paleta antiga (256 px) a la paleta oficial de 512 px.

Mou les UV al quadrant de dalt a l'esquerra (on hi ha els 64 colors de sempre)
i substitueix la textura incrustada per assets/paleta-castaween.png.
El joc ja adapta els models antics automàticament; aquest script serveix per
actualitzar plantilles o entregues perquè a Blender es vegin amb la paleta nova.

Ús: python tools/migrate-palette.py entrada.glb [sortida.glb]
"""
from pathlib import Path
import json, math, struct, sys

ROOT = Path(__file__).resolve().parents[1]
PALETTE = (ROOT / 'assets' / 'paleta-castaween.png').read_bytes()
SIZES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
WIDTH = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def read_glb(data):
    magic, version, length = struct.unpack_from('<III', data, 0)
    assert magic == 0x46546C67 and version == 2
    off, doc, bin_ = 12, None, b''
    while off < length:
        clen, ctype = struct.unpack_from('<II', data, off); off += 8
        chunk = data[off:off + clen]; off += clen
        if ctype == 0x4E4F534A: doc = json.loads(chunk)
        elif ctype == 0x004E4942: bin_ = chunk
    return doc, bytearray(bin_)

def png_size(b):
    return struct.unpack('>II', b[16:24])

def migrate(src, dst):
    doc, bin_ = read_glb(Path(src).read_bytes())
    images = doc.get('images', [])
    assert len(images) == 1, 'El model ha de tenir una sola textura'
    view = doc['bufferViews'][images[0]['bufferView']]
    old = bin_[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]
    if png_size(old) == (512, 512):
        print(src, 'ja fa servir la paleta de 512 px'); return
    assert png_size(old) == (256, 256), 'La textura no és la paleta antiga de 256 px'
    # 1. UV al quadrant de dalt a l'esquerra
    done = set()
    for mesh in doc['meshes']:
        for p in mesh['primitives']:
            i = p['attributes'].get('TEXCOORD_0')
            if i is None or i in done: continue
            done.add(i); a = doc['accessors'][i]
            assert a['componentType'] == 5126 and a['type'] == 'VEC2'
            bv = doc['bufferViews'][a['bufferView']]
            stride = bv.get('byteStride', 8); base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
            lo, hi = [math.inf] * 2, [-math.inf] * 2
            for k in range(a['count']):
                o = base + k * stride
                u, v = struct.unpack_from('<ff', bin_, o)
                u, v = (u - math.floor(u)) * 0.5, (v - math.floor(v)) * 0.5
                struct.pack_into('<ff', bin_, o, u, v)
                lo = [min(lo[0], u), min(lo[1], v)]; hi = [max(hi[0], u), max(hi[1], v)]
            if 'min' in a: a['min'], a['max'] = lo, hi
    # 2. nova textura: es reconstrueix el bloc binari amb la paleta oficial
    out = bytearray()
    for n, bv in enumerate(doc['bufferViews']):
        start = bv.get('byteOffset', 0)
        data = PALETTE if n == images[0]['bufferView'] else bin_[start:start + bv['byteLength']]
        while len(out) % 4: out.append(0)
        bv['byteOffset'] = len(out); bv['byteLength'] = len(data); out += data
    while len(out) % 4: out.append(0)
    doc['buffers'][0]['byteLength'] = len(out)
    images[0]['name'] = 'paleta-castaween'
    js = json.dumps(doc, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    glb = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + out
    Path(dst).write_bytes(glb)
    print(dst, len(glb), 'bytes')

if __name__ == '__main__':
    migrate(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else sys.argv[1])
