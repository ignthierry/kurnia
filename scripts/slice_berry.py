#!/usr/bin/env python3
"""Slice berry-sheet: background removal via border sampling (gradien-aware)."""
from PIL import Image
import numpy as np

SRC = 'berry-sheet.jpg'
im = Image.open(SRC).convert('RGB')
arr = np.array(im).astype(int)
h, w, _ = arr.shape
colW = w // 2

# Sampling background dari border tiap kolom (tepi 20px, non-karakter)
def make_bg_map(x0, x1):
    border = np.concatenate([
        arr[:30, x0:x1].reshape(-1, 3),   # atas
        arr[-30:, x0:x1].reshape(-1, 3),  # bawah
        arr[:, x0:x0+15].reshape(-1, 3),  # kiri
        arr[:, x1-15:x1].reshape(-1, 3),  # kanan
    ])
    return border.mean(axis=0)

def remove_bg(x0, x1, out_name, top=12):
    crop = im.crop((x0, top, x1, h))
    ca = np.array(crop).astype(int)
    bg = make_bg_map(x0, x1)
    diff = np.abs(ca - bg).sum(axis=2)
    # piksel konten: jauh dari bg lokal
    alpha = np.where(diff < 80, 0, 255).astype(np.uint8)
    # halo: semi-transparan utk diff 80-130
    soft = (diff >= 80) & (diff < 140)
    alpha[soft] = 100
    rgba = np.dstack([ca, alpha]).astype(np.uint8)
    out = Image.fromarray(rgba, 'RGBA')
    # trim bbox
    a = np.array(out)[:, :, 3] > 10
    if a.any():
        ys, xs = np.where(a)
        out = out.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    out.save(out_name)
    print(f'{out_name}: {out.size} (bg={bg})')

remove_bg(0, colW, 'berry_fall.png')
remove_bg(colW, w, 'berry_die.png')

# strip gabungan
f = Image.open('berry_fall.png')
d = Image.open('berry_die.png')
w2 = max(f.width, d.width)
strip = Image.new('RGBA', (w2 * 2, max(f.height, d.height)), (0, 0, 0, 0))
strip.paste(f, (0, 0))
strip.paste(d, (w2, 0))
strip.save('berry-sheet.png')
print(f'berry-sheet.png: {strip.size}')