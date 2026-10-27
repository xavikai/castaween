"""Render the game's chestnut/witch emblem as small, opaque, mask-safe app icons."""
from pathlib import Path
from PIL import Image, ImageDraw
out = Path(__file__).resolve().parents[1] / 'assets' / 'icons'
out.mkdir(parents=True, exist_ok=True)
s = 4
image = Image.new('RGB', (512*s, 512*s), '#0e1122')
draw = ImageDraw.Draw(image)
def polygon(points, fill): draw.polygon([(x*s,y*s) for x,y in points], fill=fill)
def ellipse(box, fill): draw.ellipse(tuple(v*s for v in box), fill=fill)
ellipse((72,72,440,440), '#211a3b')
body = [(142,226),(179,193),(243,155),(278,165),(335,200),(369,248),(375,306),(353,358),(303,391),(233,401),(180,380),(145,338),(132,285)]
polygon(body, '#351c19')
polygon([(149,236),(185,205),(247,170),(274,179),(326,213),(356,253),(362,302),(342,346),(298,377),(235,386),(188,368),(158,331),(145,282)], '#9b4e28')
polygon([(151,264),(186,216),(245,180),(275,189),(292,240),(237,282),(185,316),(154,305)], '#ce7838')
polygon([(159,317),(202,332),(252,336),(307,322),(358,295),(347,344),(298,377),(235,386),(188,367)], '#e4b675')
polygon([(184,335),(234,349),(288,345),(335,327),(319,356),(283,370),(235,374),(202,363)], '#f4d49c')
polygon([(177,227),(237,87),(264,133),(285,193),(334,224),(309,247),(233,257)], '#371c59')
polygon([(194,217),(237,101),(252,138),(264,193),(285,226),(238,238)], '#a35cff')
polygon([(175,224),(220,231),(275,231),(334,219),(344,234),(299,256),(232,267),(176,249),(161,237)], '#653ba0')
polygon([(205,214),(273,211),(283,229),(218,236)], '#ff8a2a')
polygon([(234,212),(252,211),(257,230),(239,232)], '#ffd27a')
polygon([(240,217),(248,216),(251,226),(242,227)], '#371c59')
ellipse((178,245,194,261), '#f4d49c')
for size, name in [(192,'icon-192.png'),(512,'icon-512.png'),(512,'icon-maskable-512.png'),(180,'apple-touch-icon.png')]:
    image.resize((size,size), Image.Resampling.LANCZOS).save(out/name, optimize=True)
print('Four opaque, mask-safe Castaween icons generated.')
