#!/usr/bin/env python3
"""Contact sheet / storyboard for THE LITTLE LIGHTHOUSE.
Renders 12 key frames from the final MP4 into a labelled 4x3 sheet.
  bash /opt/data/scripts/media-python.sh tools/storyboard.py
"""
import json, os, subprocess
from PIL import Image, ImageDraw, ImageFont

FILM = 'out/the-little-lighthouse-1080p.mp4'
OUT = 'out/storyboard.jpg'
FONT_T = 'assets/fonts/CormorantGaramond-VF.ttf'
FONT_M = 'assets/fonts/IBMPlexMono-Medium.ttf'

BEATS = [
    (1.4, 'SC.1  the room, asleep'),
    (4.2, 'the switch: light blooms'),
    (7.0, 'practising the sweep'),
    (11.2, 'close: proud head, hot beam'),
    (14.6, 'raking its own wall'),
    (16.7, 'the moth arrives'),
    (19.5, 'the lamp turns away'),
    (22.4, 'shake-off'),
    (25.4, 'deadpan: beam at the lens'),
    (27.4, 'click off — the huff'),
    (33.6, 'moonlight, dead lamp'),
    (37.6, 'the moon catches the shade'),
    (42.4, 'some lights you borrow'),
    (47.2, 'the end card'),
]

COLS, CW, CH, CAP = 4, 460, 259, 40
PAD = 22
HEAD = 108
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

tmp = '/tmp/sb'
os.makedirs(tmp, exist_ok=True)
for i, (t, cap) in enumerate(BEATS):
    p = f'{tmp}/f{i:02d}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', FILM, '-frames:v', '1',
                    '-vf', f'scale={CW}:{CH}', p], check=True)
    im = Image.open(p).convert('RGB')
    cx = PAD + (i % COLS) * (CW + PAD)
    cy = HEAD + PAD + (i // COLS) * (CH + CAP + PAD)
    d.rectangle([cx - 2, cy - 2, cx + CW + 1, cy + CH + 1], outline=(36, 26, 21), width=2)
    sheet.paste(im, (cx, cy))
    mark = f'{int(t // 60)}:{t % 60:04.1f}'
    d.text((cx + 2, cy + CH + 10), mark, font=f_cap, fill=(176, 84, 42))
    d.text((cx + 58, cy + CH + 10), cap, font=f_cap, fill=(60, 46, 36))

sheet.save(OUT, quality=92)
print(OUT, sheet.size)
