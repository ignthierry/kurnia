#!/usr/bin/env python3
"""Crop background hutan + tiles dari forest-sheet & items."""
from PIL import Image
import numpy as np

OUT = 'atlas'

BG = [8, 18, 28, 255]


def to_alpha(a, thr=90):
    a = a.copy().astype(int)
    diff = np.abs(a[:, :, :3] - np.array(BG[:3])).sum(axis=2)
    is_bg = diff < thr
    a[is_bg, 3] = 0
    soft = (diff >= thr) & (diff < 160)
    a[soft, 3] = (a[soft, 3] * 0.4).astype(int)
    return a.astype(np.uint8)


# ---------- background hutan (kanan atas) ----------
forest = Image.open('forest-sheet.png').convert('RGBA')
bg_crop = forest.crop((505, 50, 505 + 765, 50 + 370))
bg_crop = Image.fromarray(to_alpha(np.array(bg_crop)))
bg_crop.save(f'{OUT}/forest-bg.png')
print('forest-bg:', bg_crop.size)

# ---------- items: koin & kristal ----------
items = Image.open('items.png').convert('RGBA')
# koin region (asumsi grid items, area atas kiri: koin). Crop koin tunggal + stack
# items 1280x698 - cari konten: ambil area koin (kiri atas) utuh sebagai strip
koin_crop = items.crop((10, 30, 400, 260))
koin_crop = Image.fromarray(to_alpha(np.array(koin_crop)))
koin_crop.save(f'{OUT}/coins.png')
print('coins:', koin_crop.size)

# kristal pink (area tengah atas)
crys_crop = items.crop((400, 30, 800, 280))
crys_crop = Image.fromarray(to_alpha(np.array(crys_crop)))
crys_crop.save(f'{OUT}/crystals.png')
print('crystals:', crys_crop.size)

# ornamen/mirror (area kanan atas)
orn_crop = items.crop((800, 30, 1270, 300))
orn_crop = Image.fromarray(to_alpha(np.array(orn_crop)))
orn_crop.save(f'{OUT}/ornaments.png')
print('ornaments:', orn_crop.size)