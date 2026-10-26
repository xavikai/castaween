"""Prepare the classroom handouts. Run from the repository root or any directory.

Requires reportlab, pypdf and Pillow. Does not modify the existing visual guide or .blend.
"""
from pathlib import Path
import csv
import hashlib
import io
import json
import re
import shutil
import struct
import zipfile
from xml.sax.saxutils import escape

from pypdf import PdfReader
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
STUDENT = ROOT / 'carpeta-alumnat'
TEACHER = ROOT / 'documentacio-professorat'
OUT = ROOT / 'lliurament'
OUT.mkdir(exist_ok=True)

manifest = json.loads((ROOT / 'assets/referencies/mides-models.json').read_text(encoding='utf-8'))
rules = [dict(id='castanyera', name='Castanyera', height_m=1.8,
              student_triangle_budget=1500, student_size_budget_kb=400)] + manifest['models']
assert len(rules) == 20
with (STUDENT / 'mides-i-limits.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f, delimiter=';')
    writer.writerow(['Tipus', 'Model', 'Alçada (m)', 'Triangles màxims', 'Pes màxim (KB)', 'Ossos màxims', 'Observacions'])
    for m in rules:
        bones = 20 if m['id'] in ('castanyera', 'carabassot') else 12 if m['id'] in ('carabassa', 'fantasma') else 0
        writer.writerow([m['id'], m['name'], str(m['height_m']).replace('.', ','), m['student_triangle_budget'],
                         m['student_size_budget_kb'], bones, 'Llargada X = 1,20 m' if m['id'] == 'marge' else ''])

optional = STUDENT / 'opcional-animacio'
optional.mkdir(exist_ok=True)
shutil.copyfile(ROOT / 'assets/plantilles/plantilla-castanyera.glb', optional / 'plantilla-castanyera.glb')
(optional / 'LLEGEIX-ME.txt').write_text(
    'CASTANYERA AMB ESQUELET (OPCIONAL)\n\n'
    'Importa plantilla-castanyera.glb amb File > Import > glTF 2.0.\n'
    'Referència a 1,80 m. Màxim: 1.500 triangles, 20 ossos i 400 KB.\n'
    'Animacions: idle, corre, llanca, cop.\n'
    'Fes-la servir només si el professorat ha proposat treballar rig i animació.\n'
    'Comprova el model final i les animacions després d’exportar.\n', encoding='utf-8')

# Check the distributed models, rather than the older reference exports.
palette = (STUDENT / 'paleta-castaween.png').read_bytes()
palette_image = Image.open(io.BytesIO(palette)).convert('RGBA')
assert palette == (ROOT / 'assets/paleta-castaween.png').read_bytes()
references = sorted((STUDENT / 'models-referencia').glob('*.glb'))
assert {p.stem for p in references} == {m['id'] for m in rules}
for file in references + [optional / 'plantilla-castanyera.glb']:
    data = file.read_bytes()
    magic, version, length = struct.unpack_from('<4sII', data)
    assert magic == b'glTF' and version == 2 and length == len(data), file
    json_length, kind = struct.unpack_from('<II', data, 12)
    assert kind == 0x4E4F534A, file
    doc = json.loads(data[20:20 + json_length])
    assert all('uri' not in b for b in doc.get('buffers', [])), file
    assert len(doc.get('images', [])) == 1, file
    img = doc['images'][0]
    view = doc['bufferViews'][img['bufferView']]
    start = 28 + json_length + view.get('byteOffset', 0)
    embedded = Image.open(io.BytesIO(data[start:start + view['byteLength']])).convert('RGBA')
    assert embedded.size == palette_image.size and embedded.tobytes() == palette_image.tobytes(), file
    assert len(doc.get('materials', [])) == 1, file
assert (STUDENT / 'castaween-inici.blend').read_bytes().startswith((b'BLENDER', b'\x28\xb5\x2f\xfd'))
assert len(PdfReader(STUDENT / 'GUIA-castaween.pdf').pages) == 12

# Printable teacher guide; Markdown remains the editable source.
font_dir = Path('C:/Windows/Fonts')
if not (font_dir / 'arial.ttf').exists():
    font_dir = next(p for p in [Path('/usr/share/fonts/truetype/liberation2'), Path('/usr/share/fonts/truetype/liberation')] if p.exists())
    regular, bold = 'LiberationSans-Regular.ttf', 'LiberationSans-Bold.ttf'
else:
    regular, bold = 'arial.ttf', 'arialbd.ttf'
pdfmetrics.registerFont(TTFont('Class', str(font_dir / regular)))
pdfmetrics.registerFont(TTFont('ClassBold', str(font_dir / bold)))
pdfmetrics.registerFontFamily('Class', normal='Class', bold='ClassBold', italic='Class', boldItalic='ClassBold')
ink = colors.HexColor('#251e36')
orange = colors.HexColor('#b84c0d')
styles = {
    'body': ParagraphStyle('body', fontName='Class', fontSize=10.5, leading=15, spaceAfter=8, textColor=ink),
    'title': ParagraphStyle('title', fontName='ClassBold', fontSize=26, leading=30, spaceAfter=18, textColor=ink),
    'section': ParagraphStyle('section', fontName='ClassBold', fontSize=15, leading=19, spaceBefore=12, spaceAfter=10, textColor=orange, keepWithNext=True),
    'cell': ParagraphStyle('cell', fontName='Class', fontSize=9, leading=12, textColor=ink),
}
def markup(s):
    return re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', escape(s))

source = (TEACHER / 'GUIA-PROFESSORAT.md').read_text(encoding='utf-8')
sections = re.split(r'^## ', source, flags=re.M)[1:]
groups = [sections[:2], sections[2:3], sections[3:4], sections[4:]]
story = []
titles = ['Prepara l’activitat', 'Revisa les entregues', 'Porta els models al joc', 'Avalua i dona retorn']
for page, (heading, group) in enumerate(zip(titles, groups), 1):
    if page > 1:
        story.append(PageBreak())
    story.append(Paragraph(heading, styles['title']))
    for section in group:
        lines = section.strip().splitlines()
        story.append(Paragraph(markup(lines[0]), styles['section']))
        table_rows = []
        for para in '\n'.join(lines[1:]).strip().split('\n\n'):
            if para.startswith('|'):
                for row in para.splitlines():
                    cells = [c.strip() for c in row.strip('|').split('|')]
                    if all(re.fullmatch(r'[-:]+', c) for c in cells):
                        continue
                    table_rows.append([Paragraph(markup(c), styles['cell']) for c in cells])
                table = Table(table_rows, colWidths=[142, 40, 313])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ffebd6')),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('LINEBELOW', (0, 0), (-1, -1), .4, colors.HexColor('#ded8e5')),
                ]))
                story.extend([table, Spacer(1, 10)])
            else:
                for line in para.splitlines():
                    story.append(Paragraph(markup(line), styles['body']))

def footer(canvas, doc):
    canvas.setStrokeColor(orange)
    canvas.line(50, A4[1]-34, A4[0]-50, A4[1]-34)
    canvas.setFont('ClassBold', 8)
    canvas.setFillColor(ink)
    canvas.drawString(50, A4[1]-26, 'CIFOG / CASTAWEEN / PROFESSORAT')
    canvas.setFont('Class', 8)
    canvas.drawString(50, 29, 'Material de classe · 26/10/2026')
    canvas.drawRightString(A4[0]-50, 29, f'{doc.page} / 4')

pdf = TEACHER / 'GUIA-PROFESSORAT.pdf'
SimpleDocTemplate(str(pdf), pagesize=A4, topMargin=55, bottomMargin=52, leftMargin=50, rightMargin=50,
                  title='Castaween · Guia del professorat', author='CIFOG / Castaween').build(story, onFirstPage=footer, onLaterPages=footer)
assert len(PdfReader(pdf).pages) == 4, 'Unexpected page overflow'

def pack(folder, target, extra=()):
    files = [(p, p.relative_to(ROOT).as_posix()) for p in sorted(folder.rglob('*')) if p.is_file()]
    files += [(p, p.relative_to(ROOT).as_posix()) for p in extra]
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for file, name in files:
            z.write(file, name)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        for file, name in files:
            assert z.read(name) == file.read_bytes(), name
    return len(files)

count = pack(STUDENT, OUT / 'castaween-alumnat.zip')
pack(TEACHER, OUT / 'castaween-professorat.zip', [STUDENT / 'mides-i-limits.csv'])
receipt = ['CASTAWEEN · PAQUETS DE CLASSE', '',
           'Comparteix castaween-alumnat.zip amb la classe.',
           'Conserva castaween-professorat.zip per preparar i revisar l’activitat.',
           f'Paquet alumnat: {count} fitxers; guia visual de 12 pàgines i 20 models.',
           'Guia del professorat: 4 pàgines.', '', 'SHA-256:']
for file in sorted(OUT.glob('castaween-*.zip')):
    receipt.append(f'{file.name}  {hashlib.sha256(file.read_bytes()).hexdigest()}')
(OUT / 'LLEGEIX-ME.txt').write_text('\n'.join(receipt) + '\n', encoding='utf-8')
print('\n'.join(receipt))
