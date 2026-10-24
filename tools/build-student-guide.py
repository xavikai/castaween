"""Build the classroom PDF from the project's reference measurements.

Requires reportlab. Run from any directory: python tools/build-student-guide.py
"""
from pathlib import Path
from xml.sax.saxutils import escape
import json
import shutil
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, Line, String, Polygon

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf/guia-alumnat-castaween.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
fontdir = Path('C:/Windows/Fonts')
pdfmetrics.registerFont(TTFont('Guide', str(fontdir / 'arial.ttf')))
pdfmetrics.registerFont(TTFont('GuideBold', str(fontdir / 'arialbd.ttf')))
pdfmetrics.registerFontFamily('Guide', normal='Guide', bold='GuideBold', italic='Guide', boldItalic='GuideBold')
INK = colors.HexColor('#202537')
MUTED = colors.HexColor('#586075')
ORANGE = colors.HexColor('#c65b12')
PALE = colors.HexColor('#fff2e5')
LINE = colors.HexColor('#dce0e7')
GREEN = colors.HexColor('#166a54')
W = A4[0] - 100
styles = getSampleStyleSheet()
styles.add(ParagraphStyle('BodyGuide', fontName='Guide', fontSize=10.4, leading=15, textColor=INK, spaceAfter=8))
styles.add(ParagraphStyle('TitleGuide', fontName='GuideBold', fontSize=26, leading=30, textColor=INK, spaceAfter=12))
styles.add(ParagraphStyle('SectionGuide', fontName='GuideBold', fontSize=15, leading=20, textColor=ORANGE, spaceBefore=13, spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle('SmallGuide', parent=styles['BodyGuide'], fontSize=8.7, leading=12, textColor=MUTED, spaceAfter=6))
styles.add(ParagraphStyle('CellGuide', parent=styles['BodyGuide'], fontSize=8.3, leading=10, spaceAfter=0))
styles.add(ParagraphStyle('CellHeadGuide', parent=styles['CellGuide'], fontName='GuideBold', textColor=colors.white))
styles.add(ParagraphStyle('CodeGuide', fontName='Guide', fontSize=9.1, leading=13, textColor=INK, leftIndent=10, spaceAfter=8))

story = []
def p(text, style='BodyGuide'):
    return Paragraph(text, styles[style])
def body(text):
    story.append(p(text))
def title(kicker, text, intro):
    story.append(p(kicker.upper(), 'SmallGuide'))
    story.append(p(text, 'TitleGuide'))
    body(intro)
def section(text):
    story.append(p(text, 'SectionGuide'))
def step(number, text):
    row = Table([[p(str(number), 'SectionGuide'), p(text)]], colWidths=[26, W-26])
    row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    story.append(row)
def box(text):
    t = Table([[p(text)]], colWidths=[W])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#edd3b9')),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    story.extend([t, Spacer(1,10)])
def link(label,url):
    return f'<link href="{escape(url)}" color="#166a54"><u>{escape(label)}</u></link>'
BASE = 'https://xavikai.github.io/castaween/'

# PAGE 1
title('CIFOG / Castaween / Guia per a l’alumnat', 'Del model de Blender\nal joc de classe'.replace('\n','<br/>'), 'Una proposta per alumne: castanyera, monstre, arbre o objecte. Treballarem amb una escala comuna perquè tots els models puguin conviure al joc.')
box('<b>Escala comuna: 1 unitat = 1 metre.</b><br/>Blender: Metric · Unit Scale 1.000 · Length Meters.<br/>La castanyera es modela a <b>1,80 m</b>. Els altres tipus tenen la seva alçada a la taula de la pàgina 4.')
section('1. Prepara l’escena')
step(1, '<b>Acorda el tipus de model amb el professorat.</b> Pots fer una proposta diferent de la dels companys per al mateix tipus. Tria també un nom per identificar-la.')
step(2, '<b>Descarrega el GLB de referència.</b> Importa’l amb <b>File → Import → glTF 2.0</b>, sense canviar-ne l’escala. Desa’l en una col·lecció separada: <b>REFERENCIA</b>.')
step(3, '<b>Configura les unitats.</b> A <b>Scene Properties → Units</b>, posa <b>Metric</b>, <b>Unit Scale: 1.000</b> i <b>Length: Meters</b>. Comprova les dimensions del conjunt, no només les d’una peça.')
step(4, '<b>Modela amb la base a terra.</b> A Blender, <b>Z cap amunt</b>, la cara principal mirant cap a <b>-Y</b> i l’origen al centre de la base, a <b>Z = 0</b>.')
diagram = Drawing(W,72)
diagram.add(Line(28,16,28,61,strokeColor=GREEN,strokeWidth=2)); diagram.add(Polygon([28,65,24,57,32,57],fillColor=GREEN,strokeColor=GREEN))
diagram.add(Line(28,16,102,16,strokeColor=ORANGE,strokeWidth=2)); diagram.add(Polygon([107,16,99,20,99,12],fillColor=ORANGE,strokeColor=ORANGE))
diagram.add(String(38,53,'+Z: alçada',fontName='GuideBold',fontSize=10,fillColor=GREEN));diagram.add(String(114,13,'X: amplada',fontName='Guide',fontSize=10,fillColor=INK))
diagram.add(String(242,44,'Cara principal: -Y',fontName='GuideBold',fontSize=10,fillColor=INK));diagram.add(String(242,24,'Origen al centre de la base',fontName='Guide',fontSize=10,fillColor=INK));diagram.add(String(242,8,'Base a Z = 0',fontName='Guide',fontSize=10,fillColor=INK));story.append(diagram)
body(link('Models, mides i descàrregues',BASE+'assets/')+'<br/><font size="9">'+BASE+'assets/</font>')
story.append(PageBreak())

# PAGE 2
title('Producció / Materials i exportació', 'Prepara un GLB lleuger', 'El model ha de mantenir les formes clares i funcionar en un mòbil. Els límits són de triangles, no de cares de Blender.')
section('2. Material, paleta i animacions')
body('<b>Un material i una sola textura:</b> la paleta oficial de <b>256 × 256 px</b>. A l’UV Editor, assigna cada cara al centre de la casella del seu color. A la textura, fes servir interpolació <b>Closest</b>.')
body('La fila magenta és el color variable: el joc hi aplica el color del curs a les castanyeres, paradetes, fogueres i torradores; als monstres, el lila de Halloween. No cal fer cinc còpies del model.')
body('<b>Esquelet opcional.</b> La castanyera admet fins a 20 ossos; carabassa i fantasma, 12; Carabassot, 20. Sense esquelet, el joc hi aplica moviment automàtic. Els arbres i objectes no necessiten rig.')
box('<b>Noms d’animació</b><br/>Castanyera: <b>idle</b>, <b>corre</b>, <b>llanca</b>, <b>cop</b>.<br/>Monstres: <b>camina</b> (bucle) i <b>ataca</b> (sense bucle).')
section('3. Exporta des de Blender')
step(1, '<b>Desa el .blend</b> com a font editable. Selecciona només el model i, si en té, l’esquelet. Exclou la col·lecció REFERENCIA, les càmeres i les llums.')
step(2, 'Aplica <b>Ctrl+A → All Transforms</b>. Comprova de nou les mides i l’origen. Aplica els modificadors pendents; no facis servir shape keys.')
step(3, 'A <b>File → Export → glTF 2.0</b>: <b>glTF Binary (.glb)</b>, <b>Selected Objects</b>, <b>+Y Up</b>, UVs, normals i materials activats. Exporta animacions si n’hi ha. <b>Draco desactivat.</b>')
step(4, 'Fes servir un nom únic, en minúscules, sense accents ni espais:<br/><b>3d-garcia-marta-carabassa.glb</b>')
story.append(p('Blender converteix els eixos en importar i exportar glTF: al GLB l’alçada és Y; a Blender és Z. No giris la referència a mà.', 'SmallGuide'))
story.append(PageBreak())

# PAGE 3
title('Validació / Entrega', 'Prova’l abans d’entregar', 'Carregar un fitxer al Taller és una prova local. No l’envia ni el publica: el professorat l’haurà d’afegir al projecte.')
section('4. Comprova’l al Taller de models')
step(1, 'Obre <b>Personatge → Taller de models</b> al joc. Tria el <b>tipus correcte</b> i carrega el teu GLB.')
step(2, 'Revisa la silueta, les mides, els colors i les animacions. Comprova el color de tots els cursos quan correspongui.')
step(3, '<b>Corregeix els punts vermells.</b> Revisa els grocs amb el professorat. Si el model surt tombat, massa gran o separat del terra, torna a Blender i revisa eixos, mides i origen.')
step(4, 'Prova’l amb <b>Juga amb aquest model</b>, <b>Fes servir aquest monstre</b> o <b>Posa-ho a l’escena</b>. Escriu el <b>nom del model</b> i l’<b>autor/a</b> i copia l’entrada JSON del Taller.')
section('5. Què has d’entregar')
for text in ['El <b>.glb validat</b>, amb nom únic.', 'El <b>.blend</b>, com a font editable, a la plataforma o carpeta que indiqui el professorat.', 'El <b>tipus de model</b>, el <b>nom de la proposta</b>, l’<b>autor/a</b> i el <b>curs</b>.', 'L’<b>entrada JSON</b> generada al Taller.']:
    body('• '+text)
box('<b>Exemple d’entrega</b><br/>Tipus: Carabassa · Proposta: La dentuda<br/>Autora: Marta Garcia · Curs: 3D i videojocs<br/>Fitxer: <b>3d-garcia-marta-carabassa.glb</b>')
section('Revisió final abans d’enviar')
body('Escala i origen correctes · Referència exclosa · Transformacions aplicades · Paleta oficial · Pressupost de triangles i pes respectat · GLB provat al Taller · Autoria i nom de fitxer únics.')
body('<b>Les propostes conviuen:</b> els monstres i objectes que apareixen alternen per torns. Els arbres i l’escenari es reparteixen pel mapa i renoven la selecció a cada ronda. Si hi ha més propostes que llocs o aparicions, calen més rondes per veure-les totes.')
body(link('Obre el joc', BASE)+' · '+link('Guia web completa',BASE+'assets/guia-entregues.html'))
story.append(PageBreak())

# PAGE 4
title('Consulta / Escala i pressupostos', 'Mides de referència', 'Dimensions en metres a Blender. <b>Alt = Z · Ample = X · Fons = Y.</b> Respecta l’alçada d’entrega. Amplada i fondària són una referència de proporcions; el marge sí que ha de fer 1,20 m de llarg en X.')
manifest=json.loads((ROOT/'assets/referencies/mides-models.json').read_text(encoding='utf-8'))
cast=json.loads((ROOT/'assets/plantilles/mides-castanyera.json').read_text(encoding='utf-8'))
models=[dict(name='Castanyera clàssica*', height_m=1.8,width_m=cast['width_m'],depth_m=cast['depth_m'],student_triangle_budget=1500,student_size_budget_kb=400)]+manifest['models']
def fmt(n): return f'{n:.3f}'.replace('.',',')
headers=['Model','Alt','Ample','Fons','Triangles\nmàxims','KB\nmàxims']
rows=[[p(t.replace('\n','<br/>'),'CellHeadGuide') for t in headers]]
for m in models:
    rows.append([p(escape(m['name']),'CellGuide'),fmt(m['height_m']),fmt(m['width_m']),fmt(m['depth_m']),f"{m['student_triangle_budget']:,}".replace(',','.'),str(m['student_size_budget_kb'])])
t=Table(rows,colWidths=[177,51,57,57,82,W-424],repeatRows=1,rowHeights=[29]+[21]*20)
t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Guide'),('FONTSIZE',(1,1),(-1,-1),8.7),('TEXTCOLOR',(0,1),(-1,-1),INK),('BACKGROUND',(0,0),(-1,0),INK),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f3f5f7')]),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LINEBELOW',(0,0),(-1,0),1,ORANGE),('LINEBELOW',(0,1),(-1,-1),.3,LINE),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),5)]));story.extend([t,Spacer(1,12)])
story.append(p('* La castanyera nova també s’entrega a 1,80 m; l’amplada i la fondària de la taula corresponen a la referència clàssica. No cal copiar exactament la silueta.', 'SmallGuide'))
story.append(p('Els arbres i les roques són exemplars de les variants del joc. Els límits de triangles i pes són per a l’entrega; alguns GLB de referència s’han d’optimitzar i adaptar a la paleta si es reutilitzen com a base.', 'SmallGuide'))
body(link('Descarrega els GLB i les mides exactes',BASE+'assets/'))
story.append(PageBreak())

# PAGE 5
title('Per al professorat / Publicació', 'Integra les entregues', 'Afegeix cada proposta sense sobreescriure les dels companys. Els exemples següents indiquen el format: els fitxers citats han d’existir al projecte.')
section('6. Copia els fitxers i registra’ls')
body('<b>assets/castanyeres/</b>: castanyeres.<br/><b>assets/monstres/</b>: carabassa, fantasma i Carabassot.<br/><b>assets/escenari/</b>: arbres, construccions i objectes.')
body('Edita <b>assets/assets.json</b>. Conserva els apartats existents de so, música, interfície i configuració. Cada tipus de monstre o escenari pot contenir una llista de propostes. Les castanyeres van totes a la llista <b>castanyeres</b>.')
example='''"carabassa": [
  { "id": "carabassa-marta", "nom": "La dentuda",
    "autor": "Marta Garcia", "curs": "3D i videojocs",
    "fitxer": "monstres/3d-garcia-marta-carabassa.glb" },
  { "id": "carabassa-pol", "nom": "La rondinaire",
    "autor": "Pol Puig", "curs": "3D i videojocs",
    "fitxer": "monstres/3d-puig-pol-carabassa.glb" }
]'''
body('Exemple de clau dins de <b>monstres</b>:')
code=p(escape(example).replace(' ','&#160;').replace('\n','<br/>'),'CodeGuide')
ct=Table([[code]],colWidths=[W]);ct.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#f3f5f7')),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),3)]));story.append(ct)
story.append(Spacer(1,9))
body('A <b>escenari</b> s’aplica el mateix format: <b>"castanyer": [ ... ]</b>, <b>"casa": [ ... ]</b>, <b>"panellet": [ ... ]</b>, etc. Fes servir un <b>ID únic dins del tipus</b> i camins relatius a assets/, amb barres /. JSON no admet comentaris ni una coma al final de la llista.')
section('7. Publica i prova-ho')
step(1, 'A GitHub Desktop, revisa els canvis, fes <b>Commit to main</b> i <b>Push origin</b>. Inclou els GLB i el manifest. Espera que GitHub Pages acabi el desplegament.')
step(2, 'Recarrega el joc a tots els dispositius abans de crear la sala. Prova <b>Mode local · bots</b> i després una sala en línia. Per afegir models no cal redesplegar el Worker.')
box('<b>Recorda:</b> posar un GLB a la carpeta no l’activa automàticament. Cal registrar-lo al manifest. Un fitxer que falla no bloqueja els dels companys; si fallen totes les propostes d’un tipus, el joc conserva el model integrat.')
story.append(p('Guia ampliada, descàrregues i resolució d’errors:<br/>'+link(BASE+'assets/guia-entregues.html',BASE+'assets/guia-entregues.html'),'SmallGuide'))

def furniture(c, doc):
    c.saveState();w,h=A4
    c.setStrokeColor(ORANGE);c.setLineWidth(2);c.line(50,h-35,w-50,h-35)
    c.setFont('GuideBold',8);c.setFillColor(MUTED);c.drawString(50,h-28,'CASTAWEEN  /  CIFOG')
    c.setStrokeColor(LINE);c.setLineWidth(.5);c.line(50,42,w-50,42)
    c.setFont('Guide',8);c.drawString(50,29,'Guia d’entregues · 24/10/2026 · Escala: 1 unitat = 1 metre')
    c.drawRightString(w-50,29,f'{doc.page} / 5');c.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=50,leftMargin=50,topMargin=56,bottomMargin=57,title='Castaween · Guia de Blender i entrega de models',author='Castaween / CIFOG')
doc.build(story,onFirstPage=furniture,onLaterPages=furniture)
from pypdf import PdfReader
reader=PdfReader(str(OUT));assert len(reader.pages)==5, f'Unexpected overflow: {len(reader.pages)} pages'
assert all(len(page.extract_text())>400 for page in reader.pages)
public=ROOT/'assets/guia-alumnat-castaween.pdf';shutil.copyfile(OUT,public)
print(f'{OUT}\n5 pages, {OUT.stat().st_size} bytes\nPublic copy: {public}')
