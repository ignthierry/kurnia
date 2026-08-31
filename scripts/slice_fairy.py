#!/usr/bin/env python3
"""Slice fairy-sheet.png jadi atlas per animasi (latar -> transparent)."""
from PIL import Image
import numpy as np
import os

SRC = 'fairy-sheet.png'
OUT = 'atlas'
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert('RGBA')
arr = np.array(im)
h, w, _ = arr.shape
BG = np.array([8, 18, 28, 255])

def to_alpha(img_arr):
    """Ubah pixel mirip latar jadi transparan."""
    a = img_arr.copy().astype(int)
    diff = np.abs(a[:, :, :3] - BG[:3]).sum(axis=2)
    is_bg = diff < 90
    a[is_bg, 3] = 0
    # glow halus (diff 90-140) -> semi transparan
    soft = (diff >= 90) & (diff < 160)
    a[soft, 3] = np.clip(a[soft, 3] * 0.4, 0, 255).astype(int)
    return a.astype(np.uint8)

CELL = 48
START_X = 40
ROWS = {
    'stand':   (40,  [0]),
    'walk':    (40,  list(range(1, 9))),
    'jump':    (275, [0, 1, 2, 3]),
    'dash':    (275, [4, 5, 6, 7]),
    'hover':   (275, [8, 9, 10]),
    'attack':  (510, [0, 1, 2, 3]),
    'damage':  (510, [4, 5]),
    'gameover':(510, [8]),
}

for anim, (ry, cols) in ROWS.items():
    frames = []
    for ci in cols:
        x = START_X + ci * CELL
        crop = im.crop((x, ry, x + CELL, ry + CELL))
        frames.append(crop)
    # stack horizontal jadi atlas strip
    total_w = CELL * len(frames)
    strip = Image.new('RGBA', (total_w, CELL), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * CELL, 0))
    out_path = os.path.join(OUT, f'{anim}.png')
    strip = Image.fromarray(to_alpha(np.array(strip)))
    strip.save(out_path)
    print(f'{anim}: {len(frames)} frames -> {out_path}')

# items/koin: deteksi region item dari items.png
items = Image.open('items.png').convert('RGBA')
print(f'\nitems.png: {items.size}')