#!/usr/bin/env python3
"""Inject the storyboard grid into index.html between <!--SB--> and <!--/SB-->.

Reads media/sb/beats.json (written by tools/storyboard.py) so the page ships real
cells and real captions instead of one unreadable JPG.

  python3 tools/pagegrid.py
"""
import html
import json

PAGE = 'index.html'
BEATS = 'media/sb/beats.json'

with open(BEATS) as fh:
    beats = json.load(fh)

cells = []
for b in beats:
    label = html.escape(b['label'])
    cells.append(
        f'      <button class="cell" data-t="{b["t"]}" aria-label="Jump to {b["mark"]}: {label}">\n'
        f'        <img src="{b["img"]}" alt="{label} at {b["mark"]}" loading="lazy" width="560" height="315">\n'
        f'        <span class="mark">{b["mark"]}</span>\n'
        f'        <span class="label">{label}</span>\n'
        f'      </button>'
    )

block = '\n'.join(cells)
page = open(PAGE).read()
start, end = page.index('<!--SB-->'), page.index('<!--/SB-->')
page = page[:start] + '<!--SB-->\n' + block + '\n      ' + page[end:]
open(PAGE, 'w').write(page)
print(f'grid: {len(beats)} cells injected into {PAGE}')
