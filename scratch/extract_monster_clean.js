import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

function makeTransparent(rawBuffer, width, height, channels) {
  const outBuffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = (y * width + x) * 4;

      const r = rawBuffer[srcIdx];
      const g = rawBuffer[srcIdx + 1];
      const b = rawBuffer[srcIdx + 2];

      const minVal = Math.min(r, g, b);
      const maxVal = Math.max(r, g, b);
      const isNearWhite = r > 230 && g > 230 && b > 230 && (maxVal - minVal < 25);

      if (r > 248 && g > 248 && b > 248) {
        outBuffer[dstIdx] = 0;
        outBuffer[dstIdx + 1] = 0;
        outBuffer[dstIdx + 2] = 0;
        outBuffer[dstIdx + 3] = 0;
      } else if (isNearWhite && minVal > 220) {
        const alpha = Math.max(0, Math.min(255, Math.floor((248 - minVal) / 28 * 255)));
        outBuffer[dstIdx] = r;
        outBuffer[dstIdx + 1] = g;
        outBuffer[dstIdx + 2] = b;
        outBuffer[dstIdx + 3] = alpha;
      } else {
        outBuffer[dstIdx] = r;
        outBuffer[dstIdx + 1] = g;
        outBuffer[dstIdx + 2] = b;
        outBuffer[dstIdx + 3] = 255;
      }
    }
  }

  return outBuffer;
}

function getTightBounds(rgbaBuffer, width, height) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let hasPixel = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = rgbaBuffer[idx + 3];
      if (alpha > 30) {
        hasPixel = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixel) return null;
  return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function extractCleanMonster() {
  const srcPath = 'Game/monster.png';
  const outDir = 'public/assets/game/monster';

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const { data: rawData, info } = await sharp(srcPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: fullW, height: fullH, channels } = info;
  console.log(`Processing clean monster transparency (${fullW}x${fullH})...`);

  const transparentFull = makeTransparent(rawData, fullW, fullH, channels);

  // Strictly yMin = 48 to eliminate ALL text labels ("IDLE", "WALK", "ATTACK", "FALL", "DIE")
  const frameDefs = [
    { name: 'monster_idle_1', xMin: 40, xMax: 152, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_walk_1', xMin: 168, xMax: 253, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_walk_2', xMin: 254, xMax: 348, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_attack_1', xMin: 362, xMax: 448, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_attack_2', xMin: 450, xMax: 540, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_fall_1', xMin: 556, xMax: 618, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_fall_2', xMin: 620, xMax: 682, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_die_1', xMin: 692, xMax: 776, yMin: 48, yMax: fullH - 2 },
    { name: 'monster_die_2', xMin: 778, xMax: 868, yMin: 48, yMax: fullH - 2 },
  ];

  const targetSize = 128;
  const extracted = [];

  for (const def of frameDefs) {
    const cropW = def.xMax - def.xMin;
    const cropH = def.yMax - def.yMin;
    const cropBuffer = Buffer.alloc(cropW * cropH * 4);

    for (let y = 0; y < cropH; y++) {
      const srcY = def.yMin + y;
      for (let x = 0; x < cropW; x++) {
        const srcX = def.xMin + x;
        const srcIdx = (srcY * fullW + srcX) * 4;
        const dstIdx = (y * cropW + x) * 4;
        cropBuffer[dstIdx] = transparentFull[srcIdx];
        cropBuffer[dstIdx + 1] = transparentFull[srcIdx + 1];
        cropBuffer[dstIdx + 2] = transparentFull[srcIdx + 2];
        cropBuffer[dstIdx + 3] = transparentFull[srcIdx + 3];
      }
    }

    const bounds = getTightBounds(cropBuffer, cropW, cropH);
    if (!bounds) {
      console.warn(`No content for ${def.name}`);
      continue;
    }

    const tightBuffer = await sharp(cropBuffer, { raw: { width: cropW, height: cropH, channels: 4 } })
      .extract({ left: bounds.minX, top: bounds.minY, width: bounds.width, height: bounds.height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Target uniform scale: height ~84px, width ~96px max so monster scale matches fairy perfectly!
    const maxH = 88;
    const maxW = 105;
    const scale = Math.min(maxH / bounds.height, maxW / bounds.width, 1.0);
    const scaledW = Math.round(bounds.width * scale);
    const scaledH = Math.round(bounds.height * scale);

    const resized = await sharp(tightBuffer.data, { raw: { width: bounds.width, height: bounds.height, channels: 4 } })
      .resize(scaledW, scaledH, { fit: 'contain' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const targetBuffer = Buffer.alloc(targetSize * targetSize * 4, 0);
    const offsetX = Math.floor((targetSize - scaledW) / 2);
    // Align feet/ground contact exactly at y = 122
    const offsetY = Math.floor(122 - scaledH);

    for (let y = 0; y < scaledH; y++) {
      for (let x = 0; x < scaledW; x++) {
        const srcIdx = (y * scaledW + x) * 4;
        const dstX = offsetX + x;
        const dstY = offsetY + y;
        if (dstX >= 0 && dstX < targetSize && dstY >= 0 && dstY < targetSize) {
          const dstIdx = (dstY * targetSize + dstX) * 4;
          targetBuffer[dstIdx] = resized.data[srcIdx];
          targetBuffer[dstIdx + 1] = resized.data[srcIdx + 1];
          targetBuffer[dstIdx + 2] = resized.data[srcIdx + 2];
          targetBuffer[dstIdx + 3] = resized.data[srcIdx + 3];
        }
      }
    }

    const filename = `${def.name}.png`;
    const filePath = path.join(outDir, filename);

    await sharp(targetBuffer, { raw: { width: targetSize, height: targetSize, channels: 4 } })
      .png()
      .toFile(filePath);

    extracted.push({ name: def.name, filename, filePath });
    console.log(`Saved clean ${filename} (${scaledW}x${scaledH})`);
  }

  // Master Atlas
  const cols = 3;
  const rows = 3;
  const sheetW = cols * targetSize;
  const sheetH = rows * targetSize;
  const sheetBuffer = Buffer.alloc(sheetW * sheetH * 4, 0);

  const atlasJson = {
    frames: {},
    meta: {
      image: 'monster_spritesheet.png',
      format: 'RGBA8888',
      size: { w: sheetW, h: sheetH },
      scale: '1',
    },
  };

  for (let i = 0; i < extracted.length; i++) {
    const f = extracted[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const startX = col * targetSize;
    const startY = row * targetSize;

    const frameData = await sharp(f.filePath)
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const srcIdx = (y * targetSize + x) * 4;
        const dstIdx = ((startY + y) * sheetW + (startX + x)) * 4;
        sheetBuffer[dstIdx] = frameData.data[srcIdx];
        sheetBuffer[dstIdx + 1] = frameData.data[srcIdx + 1];
        sheetBuffer[dstIdx + 2] = frameData.data[srcIdx + 2];
        sheetBuffer[dstIdx + 3] = frameData.data[srcIdx + 3];
      }
    }

    atlasJson.frames[f.name] = {
      frame: { x: startX, y: startY, w: targetSize, h: targetSize },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: targetSize, h: targetSize },
      sourceSize: { w: targetSize, h: targetSize },
    };
  }

  const sheetPath = path.join(outDir, 'monster_spritesheet.png');
  await sharp(sheetBuffer, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .png()
    .toFile(sheetPath);

  const jsonPath = path.join(outDir, 'monster_spritesheet.json');
  fs.writeFileSync(jsonPath, JSON.stringify(atlasJson, null, 2));

  console.log(`\nUpdated monster_spritesheet.png and JSON with clean frames!`);
}

extractCleanMonster().catch(console.error);
