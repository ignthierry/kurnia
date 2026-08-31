#!/usr/bin/env python3
"""Crop karakter peri dari sheet (stand + walk strip)."""
from PIL import Image
import numpy as np

SRC = 'fairy-sheet.png'
OUT = 'atlas'

im = Image.open(SRC).convert('RGBA')
BG = [8, 18, 28, 255]


def to_alpha(a):
    a = a.copy().astype(int)
    diff = np.abs(a[:, :, :3] - np.array(BG[:3])).sum(axis=2)
    is_bg = diff < 90
    a[is_bg, 3] = 0
    soft = (diff >= 90) & (diff < 160)
    a[soft, 3] = (a[soft, 3] * 0.4).astype(int)
    return a.astype(np.uint8)


# Karakter utuh: crop baris 1 sprite pertama (STAND) x=40..175 y=25..185
crop = im.crop((40, 25, 175, 185))
crop = Image.fromarray(to_alpha(np.array(crop)))
crop.save(f'{OUT}/char-stand.png')
print('char-stand:', crop.size)

# Walk: 8 frame dari baris 1, pitch ~145px
frames = []
for i in range(8):
    x0 = 185 + i * 145
    f = im.crop((x0, 25, x0 + 135, 185))
    frames.append(Image.fromarray(to_alpha(np.array(f))))

# ukuran frame seragam (135x160)
strip = Image.new('RGBA', (135 * 8, 160), (0, 0, 0, 0))
for i, f in enumerate(frames):
    strip.paste(f, (i * 135, 0))
strip.save(f'{OUT}/char-walk.png')
print('char-walk:', strip.size)