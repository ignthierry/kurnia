#!/usr/bin/env python3
"""Slice luna-sheet v2: buang label, bg removal agresif (white 255)."""
from PIL import Image
import numpy as np

SRC = 'luna-sheet.jpg'
im = Image.open(SRC).convert('RGB')
arr = np.array(im).astype(int)
H, W, _ = arr.shape

# posisi frame (buang label: teks s.d. y~55, karakter mulai 60):
CELL = 128
Y = 60          # buang label (0-59)
ROWS = {
    'luna_idle':   ([0, 1, 2], Y),
    'luna_walk':   ([4, 5, 6, 7], Y),
    'luna_jump':   ([0, 1], 220),
    'luna_die':    ([2], 220),
    'luna_attack': ([3, 4, 5], 220),
}

def remove_bg_white(crop_arr):
    """Hapus putih murni + gradien halus (toleransi lebar)."""
    a = crop_arr.astype(int)
    # jarak dari putih murni
    dist_white = np.abs(a[:, :, :3] - 255).sum(axis=2)
    # juga deteksi gradien: piksel seragam (var rendah)
    alpha = np.where(dist_white < 95, 0, 255).astype(np.uint8)
    soft = (dist_white >= 95) & (dist_white < 160)
    alpha[soft] = 110
    return np.dstack([a[:, :, :3], alpha]).astype(np.uint8)

for anim, (cols, ry) in ROWS.items():
    frames = []
    for ci in cols:
        x0 = ci * CELL
        crop = im.crop((x0, ry, x0 + CELL, ry + CELL))
        rgba = remove_bg_white(np.array(crop))
        # trim: buang alpha 0 di tepi (tapi jaga jangan potong karakter)
        al = rgba[:, :, 3] > 10
        if al.any():
            ys, xs = np.where(al)
            # trim hanya padding luar (border 3px)
            y0, y1 = max(ys.min()-2, 0), min(ys.max()+3, CELL)
            x0b, x1b = max(xs.min()-2, 0), min(xs.max()+3, CELL)
            rgba = rgba[y0:y1, x0b:x1b]
        frames.append(Image.fromarray(rgba, 'RGBA'))

    fw = max(f.width for f in frames) if frames else 0
    fh = max(f.height for f in frames) if frames else 0
    strip = Image.new('RGBA', (fw * len(frames), fh), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * fw, 0))
    strip.save(f'{anim}.png')
    print(f'{anim}: {len(frames)}f -> {strip.size}')

# proyektil: kolom kanan baris bawah (x 768..1024, y 220..348)
proj = im.crop((768, 220, 1024, 348))
rgba = remove_bg_white(np.array(proj))
al = rgba[:, :, 3] > 10
if al.any():
    ys, xs = np.where(al)
    rgba = rgba[max(ys.min()-2,0):ys.max()+3, max(xs.min()-2,0):xs.max()+3]
Image.fromarray(rgba, 'RGBA').save('luna_projectile.png')
print('luna_projectile:', rgba.shape)

# verifikasi alpha tiap atlas
for anim in ROWS:
    im2 = Image.open(f'{anim}.png').convert('RGBA')
    a = np.array(im2)[:, :, 3]
    print(f'  {anim}: trans={(a<10).mean()*100:.1f}%')