"""Genera la paleta oficial de Castaween (512 x 512 px) i la seva guia.

Distribució (4 quadrants de 256 px):
  dalt-esquerra   64 colors plans en caselles de 32 px (els de sempre, mateix ordre)
  dalt-dreta      8 degradats horitzontals de 32 px d'alt (clar -> fosc)
  baix-esquerra   16 ulls en caselles de 64 px
  baix-dreta      8 degradats més

Els models fets amb la paleta antiga de 256 px continuen funcionant: el joc
els adapta perquè el quadrant de dalt a l'esquerra és idèntic.

Ús: python tools/build-palette.py   (requereix Pillow i numpy)
"""
from pathlib import Path
import json, hashlib, base64
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
SIZE = 512

SOLIDS = [
    ('Pells', 'F6D4B0 EEC39C E8B48C D9A077 C98E62 A8714A 9A6440 6B4228'),
    ('Cabells', 'F0ECE4 C9C4BC 8A8480 E2C27A B4532A 6A4024 3A2418 2A1E18'),
    ('Roba', 'EFE4CC FAF8F2 E6D8BE 3A2418 5A1A24 24382A 1E2A48 1E1A22'),
    ('Castanyada', 'F2C230 E0902A C9771F 9A6A36 7A4E26 6B3B1E 5A2F16 8A3446'),
    ('Halloween', 'FFB35A E8731C B5501A 3B5A24 DFE6FF A35CFF 5A2A90 2E2440'),
    ('Vius', 'E0405A C23A3A EC8F8A FFD24A 63D471 3EC7E0 3A5AA0 FF8A2A'),
    ('Neutres', 'FFFFFF D8D4CC A8A49C 77736A 5E5A54 3A3634 1C1410 0A0A0E'),
    ('CURS', 'FF00FF E600E6 CC00CC B300B3 990099 800080 660066 4D004D'),
]
# Degradats: nom i parades de color d'esquerra (clar) a dreta (fosc).
GRADIENTS = [
    ('Pell', 'F6D4B0 D9A077 A8714A 6B4228'),
    ('Castanya', 'E2C27A 9A6A36 6A4024 2A1E18'),
    ('Foc', 'FFF2A0 FFD24A E8731C C23A3A 5A1A24'),
    ('Carabassa', 'FFB35A E8731C B5501A 5A2F16'),
    ('Nit lila', 'DFE6FF A35CFF 5A2A90 2E2440'),
    ('Fantasma', 'FFFFFF DFE6FF 8F9CC8 3A4470'),
    ('Vegetació', '9BE07A 63D471 3B5A24 24382A'),
    ('CURS', 'FF00FF 4D004D'),
    ('Pedra', 'FFFFFF A8A49C 3A3634 0A0A0E'),
    ('Fusta', 'E6C08A 9A6A36 5A2F16 2A1A10'),
    ('Panellet', 'FAF8F2 F2C230 C9771F'),
    ('Moniato', 'FFB35A E0902A 8A3446 4A1A2A'),
    ('Aigua', 'DFF8FF 3EC7E0 3A5AA0 1E2A48'),
    ('Or', 'FFF2A0 F2C230 9A6A36 3A2418'),
    ('Verí', 'E4FFA0 63D471 3B5A24 1C2A14'),
    ('Vermell', 'EC8F8A E0405A C23A3A 5A1A24'),
]
EYES = [
    'Marró', 'Blau', 'Verd', 'Fosc',
    'Mira a l\'esquerra', 'Mira a la dreta', 'Espantat', 'Mig tancat',
    'Carabassa', 'Enfadada', 'Fantasma', 'Carabassot',
    'Monstre', 'Espiral', 'KO', 'Brillant',
]

def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def gradient_row(stops, width=256):
    cols = np.array([rgb(s) for s in stops.split()], float)
    t = np.linspace(0, 1, width)
    pos = np.linspace(0, 1, len(cols))
    return np.stack([np.interp(t, pos, cols[:, k]) for k in range(3)], 1)

def eye(i):
    """Dibuixa un ull de 64 px (supermostrejat 4x)."""
    S = 256
    OUT, WHITE, BLACK = rgb('1C1410'), rgb('FFFFFF'), rgb('0A0A0E')
    im = Image.new('RGB', (S, S), OUT)
    d = ImageDraw.Draw(im)
    def sclera():
        d.ellipse((14, 40, S - 14, S - 40), fill=WHITE)
    def iris(col, dx=0, r=50, pupil=26):
        cx, cy = S // 2 + dx, S // 2
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgb(col))
        d.ellipse((cx - pupil, cy - pupil, cx + pupil, cy + pupil), fill=BLACK)
        d.ellipse((cx - r * .55, cy - r * .6, cx - r * .03, cy - r * .08), fill=WHITE)
    def clip_to_sclera():
        mask = Image.new('L', (S, S), 0)
        ImageDraw.Draw(mask).ellipse((14, 40, S - 14, S - 40), fill=255)
        base = Image.new('RGB', (S, S), OUT)
        base.paste(im, (0, 0), mask)
        return base
    if i < 4:
        sclera(); iris(['6A4024', '3A5AA0', '3B7A3A', '2A1E18'][i]); im = clip_to_sclera()
    elif i in (4, 5):
        sclera(); iris('6A4024', dx=-44 if i == 4 else 44); im = clip_to_sclera()
    elif i == 6:
        sclera(); iris('6A4024', r=22, pupil=12); im = clip_to_sclera()
    elif i == 7:
        sclera(); iris('6A4024'); im = clip_to_sclera(); d = ImageDraw.Draw(im)
        d.rectangle((0, 0, S, S // 2 + 4), fill=rgb('A8714A'))
        d.line((10, S // 2 + 4, S - 10, S // 2 + 4), fill=OUT, width=14)
    elif i in (8, 9):
        im = Image.new('RGB', (S, S), rgb('E8731C')); d = ImageDraw.Draw(im)
        tri = [(36, 196), (220, 196), (128, 50)] if i == 8 else [(30, 70), (226, 120), (110, 206)]
        d.polygon(tri, fill=rgb('5A1A24'))
        inner = [(x * .62 + 128 * .38, y * .62 + (sum(p[1] for p in tri) / 3) * .38) for x, y in tri]
        d.polygon(inner, fill=rgb('FFD24A'))
    elif i == 10:
        im = Image.new('RGB', (S, S), rgb('DFE6FF')); d = ImageDraw.Draw(im)
        d.ellipse((70, 24, 186, 232), fill=BLACK)
        d.ellipse((96, 52, 128, 92), fill=rgb('3A4470'))
    elif i == 11:
        im = Image.new('RGB', (S, S), rgb('B5501A')); d = ImageDraw.Draw(im)
        d.polygon([(20, 90), (236, 60), (200, 190), (60, 200)], fill=BLACK)
        d.polygon([(70, 120), (196, 104), (176, 166), (88, 172)], fill=rgb('C23A3A'))
        d.ellipse((112, 118, 150, 156), fill=rgb('FFD24A'))
    elif i == 12:
        im = Image.new('RGB', (S, S), OUT); d = ImageDraw.Draw(im)
        d.ellipse((10, 34, S - 10, S - 34), fill=rgb('FFD24A'))
        d.ellipse((50, 54, S - 50, S - 54), fill=rgb('E0902A'))
        d.ellipse((112, 44, 144, 212), fill=BLACK)
    elif i == 13:
        im = Image.new('RGB', (S, S), WHITE); d = ImageDraw.Draw(im)
        pts = [(128 + np.cos(a) * a * 9.5, 128 + np.sin(a) * a * 9.5) for a in np.linspace(0, 12.5, 400)]
        d.line(pts, fill=rgb('5A2A90'), width=16)
    elif i == 14:
        sclera(); im = clip_to_sclera(); d = ImageDraw.Draw(im)
        d.line((80, 80, 176, 176), fill=BLACK, width=26); d.line((176, 80, 80, 176), fill=BLACK, width=26)
    elif i == 15:
        sclera(); iris('3A5AA0', r=60, pupil=30); im = clip_to_sclera(); d = ImageDraw.Draw(im)
        d.ellipse((150, 136, 172, 158), fill=WHITE)
    return np.array(im.resize((64, 64), Image.LANCZOS))

def build():
    a = np.zeros((SIZE, SIZE, 3), np.uint8)
    for r, (_, row) in enumerate(SOLIDS):
        for c, h in enumerate(row.split()):
            a[r * 32:(r + 1) * 32, c * 32:(c + 1) * 32] = rgb(h)
    for g, (_, stops) in enumerate(GRADIENTS):
        y = (g % 8) * 32 + (0 if g < 8 else 256)
        a[y:y + 32, 256:512] = np.round(gradient_row(stops)).astype(np.uint8)[None]
    for i in range(16):
        x, y = (i % 4) * 64, 256 + (i // 4) * 64
        a[y:y + 64, x:x + 64] = eye(i)
    # El joc tenyeix amb el color del curs els píxels "magenta". Fora de la fila
    # i el degradat CURS no n'hi pot haver cap, o canviarien de color per error.
    f = a.astype(float) / 255
    mag = (f[..., 1] < 0.12) & (np.abs(f[..., 0] - f[..., 2]) < 0.1) & ((f[..., 0] + f[..., 2]) / 2 > 0.2)
    allowed = np.zeros_like(mag)
    allowed[224:256, 0:256] = True
    allowed[224:256, 256:512] = True
    bad = np.argwhere(mag & ~allowed)
    assert not len(bad), f'Hi ha colors magenta fora de la fila CURS: {bad[:5].tolist()}'
    return a

def font(size, bold=False):
    for name in (['arialbd.ttf', 'DejaVuSans-Bold.ttf'] if bold else ['arial.ttf', 'DejaVuSans.ttf']):
        for base in ('C:/Windows/Fonts', '/usr/share/fonts/truetype/dejavu'):
            p = Path(base) / name
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()

def guide(a):
    """Guia gran amb codis, noms dels degradats i dels ulls (no s'usa com a textura)."""
    Z = 2  # 1 px de la paleta = 2 px de la guia
    L, T, GAP = 150, 70, 26
    W, H = L + SIZE * Z + 40, T + SIZE * Z + GAP + 40
    g = Image.new('RGB', (W, H), rgb('171A31'))
    d = ImageDraw.Draw(g)
    big = Image.fromarray(a).resize((SIZE * Z, SIZE * Z), Image.NEAREST)
    # separa visualment els quadrants
    top, bot = big.crop((0, 0, SIZE * Z, 256 * Z)), big.crop((0, 256 * Z, SIZE * Z, SIZE * Z))
    g.paste(top, (L, T)); g.paste(bot, (L, T + 256 * Z + GAP))
    d.text((20, 18), 'Paleta Castaween · 512 × 512 px · textura obligatòria', fill=rgb('F4EAD6'), font=font(28, True))
    f12, f14, f16 = font(13), font(15), font(17, True)
    for r, (name, row) in enumerate(SOLIDS):
        y = T + r * 64
        d.text((20, y + 22), name, fill=rgb('FF8A2A') if name == 'CURS' else rgb('F4EAD6'), font=f16)
        for c, h in enumerate(row.split()):
            x = L + c * 64
            col = rgb(h); txt = (0, 0, 0) if sum(col) > 380 else (255, 255, 255)
            d.text((x + 4, y + 3), f'{r},{c}', fill=txt, font=f12)
            d.text((x + 4, y + 46), '#' + h, fill=txt, font=font(11))
    for k, (name, _) in enumerate(GRADIENTS):
        y = T + (k % 8) * 64 + (0 if k < 8 else 256 * Z + GAP)
        x = L + 256 * Z
        col = tuple(int(v) for v in a[(k % 8) * 32 + 16 + (0 if k < 8 else 256), 300])
        txt = (0, 0, 0) if sum(col) > 380 else (255, 255, 255)
        d.text((x + 8, y + 22), f'Degradat · {name}', fill=txt, font=f14)
    d.text((20, T + 256 * Z + GAP + 22), 'Ulls', fill=rgb('F4EAD6'), font=f16)
    d.text((20, T + 256 * Z + GAP + 48), 'caselles de\n64 px', fill=rgb('BCB4C9'), font=f12)
    for i, name in enumerate(EYES):
        x, y = L + (i % 4) * 128, T + 256 * Z + GAP + (i // 4) * 128
        d.rectangle((x, y + 112, x + 127, y + 127), fill=rgb('171A31'))
        d.text((x + 4, y + 113), name, fill=rgb('F4EAD6'), font=f12)
    d.text((20, H - 30), 'Interpolació Closest a Blender · cada cara al centre d\'una casella o dins d\'una franja de degradat · fila i degradat CURS = color del curs', fill=rgb('BCB4C9'), font=f12)
    return g

if __name__ == '__main__':
    a = build()
    Image.fromarray(a).save(ASSETS / 'paleta-castaween.png', optimize=True)
    (ROOT / 'server' / 'palette-image.js').write_text('// Generated from assets/paleta-castaween.png.\nexport const PALETTE_PNG_BASE64='+json.dumps(base64.b64encode((ASSETS / 'paleta-castaween.png').read_bytes()).decode())+';\n', encoding='utf-8')
    guide(a).save(ASSETS / 'paleta-guia.png', optimize=True)
    # Mostres per comprovar al servidor que l'entrega porta la paleta oficial.
    pts = [(c * 32 + 16, r * 32 + 16) for r in range(8) for c in range(8)]
    pts += [(256 + 16 + 32 * k, y + 16) for y in range(0, 512, 32) for k in range(8)]
    pts += [(x + dx, 256 + y + dy) for y in range(0, 256, 64) for x in range(0, 256, 64) for dy in (12, 32, 52) for dx in (12, 32, 52)]
    sig = [[x, y, *map(int, a[y, x])] for x, y in pts]
    (ROOT / 'server' / 'palette-signature.js').write_text(
        '// Generat per tools/build-palette.py. No l\'editis a mà.\n'
        f'export const PALETTE_SIZE={SIZE};\n'
        f'export const PALETTE_RGBA_SHA256="{hashlib.sha256(Image.fromarray(a).convert("RGBA").tobytes()).hexdigest()}";\n'
        f'export const LEGACY_RGBA_SHA256="{hashlib.sha256(Image.fromarray(a).crop((0,0,256,256)).convert("RGBA").tobytes()).hexdigest()}";\n'
        '// [x, y, r, g, b]: les 64 primeres mostres són també la paleta antiga de 256 px.\n'
        f'export const PALETTE_SAMPLES={json.dumps(sig, separators=(",", ":"))};\n', encoding='utf-8')
    print('paleta-castaween.png', (ASSETS / 'paleta-castaween.png').stat().st_size, 'bytes')
