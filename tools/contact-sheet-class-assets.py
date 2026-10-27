import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
folder = Path(sys.argv[1])
files = sorted(folder.glob('*.png'), key=lambda p: p.name.lower())
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
sheet = Image.new('RGB', (5 * 320, ((len(files) + 4) // 5) * 360), '#211b2c')
draw = ImageDraw.Draw(sheet)
for i, file in enumerate(files):
    x, y = i % 5 * 320, i // 5 * 360
    image = Image.open(file).convert('RGB').resize((312, 312))
    sheet.paste(image, (x + 4, y))
    label = file.stem.replace('3d-', '').replace('3D-', '').replace('3d_', '').replace('1GS-', '')
    midpoint = len(label) // 2
    cut = label.find('-', midpoint)
    if cut < 0: cut = min(32, len(label))
    draw.text((x + 8, y + 314), label[:cut], font=font, fill='white')
    draw.text((x + 8, y + 334), label[cut:].lstrip('-'), font=font, fill='#cfbbdd')
sheet.save(folder.parent / (folder.name + '-contacte.jpg'), quality=92)
