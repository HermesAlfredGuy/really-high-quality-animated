#!/usr/bin/env python3
"""Storyboard for THE LITTLE LIGHTHOUSE.

Emits three things from the final master:
  media/sb/f01.jpg … f14.jpg   one cell per beat (560x315, page-quality)
  media/sb/beats.json          the beat list the page builds its grid from
  out/storyboard.jpg           the whole thing as a single contact sheet

  bash /opt/data/scripts/media-python.sh tools/storyboard.py
"""
import json, os, subprocess
from PIL import Image, ImageDraw, ImageFont

FILM = 'out/the-little-lighthouse-1080p.mp4'
SHEET = 'out/storyboard.jpg'
CELLS = 'media/sb'
FONT_T = 'assets/fonts/CormorantGaramond-VF.ttf'
FONT_M = 'assets/fonts/IBMPlexMono-Medium.ttf'

BEATS = [
    (1.2, 'SC.1  the room, asleep'),
    (4.2, 'the switch — light blooms'),
    (7.2, 'practising the sweep'),
    (11.2, 'close: proud head, hot beam'),
    (14.6, 'raking its own wall'),
    (16.7, 'the moth arrives'),
    (19.6, 'the lamp turns away'),
    (22.4, 'shake-off'),
    (25.3, 'deadpan: beam into the lens'),
    (27.4, 'click off — the huff'),
    (30.4, 'darkness, holding'),
    (33.6, 'moonlight, dead lamp'),
    (37.6, 'the moon catches the shade'),
    (47.2, 'the end card'),
]

os.makedirs(CELLS, exist_ok=True)


def grab(t, w, h, out):
    """Pull one frame and resize it with PIL, so the cell is exactly w x h.

    ffmpeg cannot write 560x315 JPEGs directly: 315 is odd and yuv420 needs even
    dimensions, so it silently emits 560x314 and the page's declared height is a lie.
    """
    png = out + '.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', FILM, '-frames:v', '1',
                    '-vf', f'scale={w * 2}:{h * 2}:force_original_aspect_ratio=increase', png], check=True)
    im = Image.open(png).convert('RGB')
    imw, imh = im.size
    # centre-crop to the 16:9 target, then resample to the exact cell size
    tw, th = w * 2, h * 2
    if imw / imh > w / h:
        nw = int(imh * w / h)
        im = im.crop(((imw - nw) // 2, 0, (imw + nw) // 2, imh))
    else:
        nh = int(imw * h / w)
        im = im.crop((0, (imh - nh) // 2, imw, (imh + nh) // 2))
    im.resize((w, h), Image.LANCZOS).save(out, quality=88, subsampling=0)
    os.remove(png)


beats = []
for i, (t, cap) in enumerate(BEATS, start=1):
    name = f'f{i:02d}.jpg'
    grab(t, 560, 315, f'{CELLS}/{name}')
    mark = f'{int(t // 60)}:{t % 60:04.1f}'
    beats.append({'i': i, 't': t, 'mark': mark, 'label': cap, 'img': f'media/sb/{name}'})

with open(f'{CELLS}/beats.json', 'w') as fh:
    json.dump(beats, fh, indent=1)

# ── the single-sheet version ────────────────────────────────────────────────
COLS, CW, CH, CAP = 4, 460, 259, 40
PAD, HEAD = 22, 108
rows = (len(BEATS) + COLS - 1) // COLS
W = COLS * CW + (COLS + 1) * PAD
H = HEAD + rows * (CH + CAP) + (rows + 1) * PAD

sheet = Image.new('RGB', (W, H), (239, 227, 200))
d = ImageDraw.Draw(sheet)
f_title = ImageFont.truetype(FONT_T, 54)
f_sub = ImageFont.truetype(FONT_M, 15)
f_cap = ImageFont.truetype(FONT_M, 14)

d.text((PAD + 4, PAD + 2), 'The Little Lighthouse', font=f_title, fill=(36, 26, 21))
d.text((PAD + 8, PAD + 62), 'STORYBOARD  ·  50 S  ·  1920x1080  ·  24 FPS  ·  EVERY FRAME DRAWN IN CODE',
       font=f_sub, fill=(120, 96, 74))

for i, (t, cap) in enumerate(BEATS):
    im = Image.open(f'{CELLS}/f{i + 1:02d}.jpg').convert('RGB').resize((CW, CH))
    cx = PAD + (i % COLS) * (CW + PAD)
    cy = HEAD + PAD + (i // COLS) * (CH + CAP + PAD)
    d.rectangle([cx - 2, cy - 2, cx + CW + 1, cy + CH + 1], outline=(36, 26, 21), width=2)
    sheet.paste(im, (cx, cy))
    mark = f'{int(t // 60)}:{t % 60:04.1f}'
    d.text((cx + 2, cy + CH + 10), mark, font=f_cap, fill=(176, 84, 42))
    d.text((cx + 58, cy + CH + 10), cap, font=f_cap, fill=(60, 46, 36))

sheet.save(SHEET, quality=92)
print(SHEET, sheet.size, '|', len(beats), 'cells')
