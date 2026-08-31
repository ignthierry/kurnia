import Phaser from 'phaser';

// Procedural texture factory: semua aset digambar via canvas,
// tanpa file eksternal. Texture dinamis per scene.

export function createGameTextures(scene: Phaser.Scene): void {
  // ---------- peri (fairy) ----------
  if (!scene.textures.exists('fairy')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // badan
    g.fillStyle(0xfff3e0);
    g.fillCircle(16, 22, 9);
    // kepala
    g.fillStyle(0xffe0b2);
    g.fillCircle(16, 10, 7);
    // rambut
    g.fillStyle(0xf8b500);
    g.fillCircle(16, 6, 6);
    // sayap kiri & kanan (semi transparan)
    g.fillStyle(0xc9f0ff, 0.85);
    g.fillEllipse(4, 16, 12, 16);
    g.fillEllipse(28, 16, 12, 16);
    // gaun
    g.fillStyle(0xb2ebf2);
    g.fillTriangle(16, 26, 8, 38, 24, 38);
    // glow pusat
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(16, 22, 4);
    g.generateTexture('fairy', 32, 44);
    g.destroy();
  }

  // ---------- kelelawar ----------
  if (!scene.textures.exists('bat')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4a235a);
    // sayap
    g.fillTriangle(4, 8, 2, 0, 12, 6);
    g.fillTriangle(28, 8, 30, 0, 20, 6);
    // badan
    g.fillCircle(16, 10, 6);
    // mata
    g.fillStyle(0xff5555);
    g.fillCircle(13, 9, 1.6);
    g.fillCircle(19, 9, 1.6);
    g.generateTexture('bat', 32, 18);
    g.destroy();
  }

  // ---------- tanaman berduri ----------
  if (!scene.textures.exists('thornPlant')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2e7d32);
    g.fillCircle(16, 10, 8);
    g.fillStyle(0x66bb6a);
    g.fillCircle(13, 8, 4);
    g.fillStyle(0x1b5e20);
    g.fillTriangle(16, 2, 12, 10, 20, 10);
    g.fillTriangle(6, 12, 0, 6, 12, 14);
    g.fillTriangle(26, 12, 32, 6, 20, 14);
    g.generateTexture('thornPlant', 32, 24);
    g.destroy();
  }

  // ---------- orb / stardust ----------
  if (!scene.textures.exists('orb')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffe082, 0.3);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xffd54f);
    g.fillCircle(12, 12, 7);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(9, 9, 2.5);
    g.generateTexture('orb', 24, 24);
    g.destroy();
  }

  // ---------- platform daun ----------
  if (!scene.textures.exists('leafPlat')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4caf50, 0.9);
    g.fillRoundedRect(0, 4, 96, 16, 8);
    g.fillStyle(0x81c784, 0.6);
    g.fillRoundedRect(4, 0, 88, 10, 6);
    g.generateTexture('leafPlat', 96, 24);
    g.destroy();
  }

  // ---------- platform kayu ----------
  if (!scene.textures.exists('woodPlat')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x795548);
    g.fillRoundedRect(0, 2, 96, 18, 5);
    g.fillStyle(0xa1887f);
    g.fillRoundedRect(2, 0, 92, 8, 4);
    g.generateTexture('woodPlat', 96, 22);
    g.destroy();
  }

  // ---------- jamur glow ----------
  if (!scene.textures.exists('mushroom')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff80ab);
    g.fillRoundedRect(8, 18, 16, 14, 4);
    g.fillStyle(0xf48fb1);
    g.fillRoundedRect(2, 4, 28, 14, 8);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(9, 9, 3);
    g.fillCircle(23, 14, 2);
    g.generateTexture('mushroom', 32, 36);
    g.destroy();
  }

  // ---------- partikel sparkle ----------
  if (!scene.textures.exists('sparkle')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(4, 4, 4);
    g.generateTexture('sparkle', 8, 8);
    g.destroy();
  }

  // ---------- portal / gerbang ----------
  if (!scene.textures.exists('portal')) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x7c4dff, 0.25);
    g.fillRoundedRect(0, 0, 48, 72, 20);
    g.fillStyle(0xb388ff, 0.6);
    g.fillRoundedRect(8, 6, 32, 60, 14);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(24, 20, 5);
    g.fillCircle(14, 40, 3);
    g.fillCircle(34, 52, 3);
    g.generateTexture('portal', 48, 72);
    g.destroy();
  }
}