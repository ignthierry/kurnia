#!/usr/bin/env python3
"""Slice luna-sheet final: uniform 128px cell, label dibuang via offset Y."""
from PIL import Image
import numpy as np

SRC = 'luna-sheet.jpg'
im = Image.open(SRC).convert('RGB')
arr = np.array(im).astype(int)
H, W, _ = arr.shape

CELL = 128
# Label di baris atas: y25-55 -> crop mulai y=60; frame: y60..188 (128px)
# Label di baris bawah: y224-244 -> crop mulai y=248; frame: y248..376
ROW_TOP = (60, 188)
ROW_BOT = (248, 376)

def white_to_alpha(a):
    dist = np.abs(a[:, :, :3] - 255).sum(axis=2)
    alpha = np.where(dist < 95, 0, 255).astype(np.uint8)
    soft = (dist >= 95) & (dist < 160)
    alpha[soft] = 110
    return np.dstack([a[:, :, :3], alpha]).astype(np.uint8)

ROWS = {
    'luna_idle':   (ROW_TOP, [0, 1, 2]),
    'luna_walk':   (ROW_TOP, [4, 5, 6, 7]),
    'luna_jump':   (ROW_BOT, [0, 1]),
    'luna_die':    (ROW_BOT, [2]),
    'luna_attack': (ROW_BOT, [3, 4, 5]),
}

for anim, ((y0, y1), cols) in ROWS.items():
    frames = []
    for ci in cols:
        x0 = ci * CELL
        crop = im.crop((x0, y0, x0 + CELL, y1))
        rgba = white_to_alpha(np.array(crop))
        frames.append(Image.fromarray(rgba, 'RGBA'))
    # uniform strip: fw = CELL, fh = y1-y0
    fh = y1 - y0
    strip = Image.new('RGBA', (CELL * len(frames), fh), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * CELL, 0))
    strip.save(f'{anim}.png')
    print(f'{anim}: {len(frames)}f cell {CELL}x{fh}')

# proyektil
proj = im.crop((768, 248, 1024, 376))
rgba = white_to_alpha(np.array(proj))
Image.fromarray(rgba, 'RGBA').save('luna_projectile.png')
print('luna_projectile: ok')