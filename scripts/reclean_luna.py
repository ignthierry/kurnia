#!/usr/bin/env python3
"""Re-slice luna atlas: alpha lebih bersih (bg putih hilang total, fringe minim)."""
from PIL import Image
import numpy as np

SRC = 'public/assets/game/luna/luna-sheet.jpg'
im = Image.open(SRC).convert('RGB')
CELL = 128
ROW_TOP = (60, 188)
ROW_BOT = (248, 376)

def clean_alpha(a):
    dist = np.abs(a[:, :, :3] - 255).sum(axis=2)
    alpha = np.where(dist < 120, 0, 255).astype(np.uint8)
    soft = (dist >= 120) & (dist < 190)
    alpha[soft] = 60
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
        crop = im.crop((ci * CELL, y0, ci * CELL + CELL, y1))
        rgba = clean_alpha(np.array(crop))
        frames.append(Image.fromarray(rgba, 'RGBA'))
    strip = Image.new('RGBA', (CELL * len(frames), y1 - y0), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * CELL, 0))
    strip.save(f'public/assets/game/luna/{anim}.png')
    print(anim, strip.size)

proj = im.crop((768, 248, 1024, 376))
rgba = clean_alpha(np.array(proj))
Image.fromarray(rgba, 'RGBA').save('public/assets/game/luna/luna_projectile.png')
print('projectile ok')