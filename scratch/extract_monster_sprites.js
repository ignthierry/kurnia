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
        // Transparent
        outBuffer[dstIdx] = 0;
        outBuffer[dstIdx + 1] = 0;
        outBuffer[dstIdx + 2] = 0;
        outBuffer[dstIdx + 3] = 0;
      } else if (isNearWhite && minVal > 225) {
        // Soft alpha feathering
        const alpha = Math.max(0, Math.min(255, Math.floor((248 - minVal) / 23 * 255)));
        outBuffer[dstIdx] = r;
        outBuffer[dstIdx + 1] = g;
        outBuffer[dstIdx + 2] = b;
        outBuffer[dstIdx + 3] = alpha;
      } else {
        // Opaque
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

async function extractMonster() {
  const srcPath = 'Game/monster.png';
  const outDir = 'public/assets/game/monster';

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const { data: rawData, info } = await sharp(srcPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: fullW, height: fullH, channels } = info;
  console.log(`Extracting monster from ${fullW}x${fullH}...`);

  const transparentFull = makeTransparent(rawData, fullW, fullH, channels);

  // We only look below y = 36 to skip the text headers ("NEW MONSTER...", "IDLE", "WALK", etc.)
  const spriteYMin = 36;
  const spriteH = fullH - spriteYMin;
  const bodyBuffer = Buffer.alloc(fullW * spriteH * 4);

  for (let y = 0; y < spriteH; y++) {
    const srcY = spriteYMin + y;
    const srcOffset = srcY * fullW * 4;
    const dstOffset = y * fullW * 4;
    transparentFull.copy(bodyBuffer, dstOffset, srcOffset, srcOffset + fullW * 4);
  }

  // Find column spans
  const colDensity = new Array(fullW).fill(0);
  for (let x = 0; x < fullW; x++) {
    for (let y = 0; y < spriteH; y++) {
      const alpha = bodyBuffer[(y * fullW + x) * 4 + 3];
      if (alpha > 35) colDensity[x]++;
    }
  }

  const spans = [];
  let inSpan = false;
  let spanStart = 0;
  let emptyCount = 0;

  for (let x = 0; x < fullW; x++) {
    if (colDensity[x] > 4) {
      if (!inSpan) {
        inSpan = true;
        spanStart = Math.max(0, x - 4);
      }
      emptyCount = 0;
    } else {
      if (inSpan) {
        emptyCount++;
        if (emptyCount > 10 || x === fullW - 1) {
          inSpan = false;
          const spanEnd = Math.min(fullW, x - emptyCount + 4);
          if (spanEnd - spanStart > 35) {
            spans.push({ startX: spanStart, endX: spanEnd });
          }
        }
      }
    }
  }

  console.log(`Found ${spans.length} monster frames.`);
  spans.forEach((s, i) => console.log(`Frame ${i + 1}: x=${s.startX}..${s.endX} (w=${s.endX - s.startX})`));

  // Map 9 frames to their action names:
  // 1: IDLE
  // 2, 3: WALK (walk_1, walk_2)
  // 4, 5: ATTACK (attack_1, attack_2)
  // 6, 7: FALL (fall_1, fall_2)
  // 8, 9: DIE (die_1, die_2)
  const frameNames = [
    'monster_idle_1',
    'monster_walk_1',
    'monster_walk_2',
    'monster_attack_1',
    'monster_attack_2',
    'monster_fall_1',
    'monster_fall_2',
    'monster_die_1',
    'monster_die_2',
  ];

  const extracted = [];
  const targetSize = 128;

  for (let i = 0; i < spans.length && i < frameNames.length; i++) {
    const span = spans[i];
    const frameName = frameNames[i];
    const frameW = span.endX - span.startX;
    const frameBuffer = Buffer.alloc(frameW * spriteH * 4);

    for (let y = 0; y < spriteH; y++) {
      for (let x = 0; x < frameW; x++) {
        const srcIdx = (y * fullW + (span.startX + x)) * 4;
        const dstIdx = (y * frameW + x) * 4;
        frameBuffer[dstIdx] = bodyBuffer[srcIdx];
        frameBuffer[dstIdx + 1] = bodyBuffer[srcIdx + 1];
        frameBuffer[dstIdx + 2] = bodyBuffer[srcIdx + 2];
        frameBuffer[dstIdx + 3] = bodyBuffer[srcIdx + 3];
      }
    }

    const bounds = getTightBounds(frameBuffer, frameW, spriteH);
    if (!bounds) continue;

    const tightBuffer = await sharp(frameBuffer, { raw: { width: frameW, height: spriteH, channels: 4 } })
      .extract({ left: bounds.minX, top: bounds.minY, width: bounds.width, height: bounds.height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Scale to fit target canvas (128x128)
    const maxDim = Math.max(bounds.width, bounds.height);
    const scale = maxDim > 110 ? 110 / maxDim : 1;
    const scaledW = Math.round(bounds.width * scale);
    const scaledH = Math.round(bounds.height * scale);

    const resized = await sharp(tightBuffer.data, { raw: { width: bounds.width, height: bounds.height, channels: 4 } })
      .resize(scaledW, scaledH, { fit: 'contain' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const targetBuffer = Buffer.alloc(targetSize * targetSize * 4, 0);
    const offsetX = Math.floor((targetSize - scaledW) / 2);
    const offsetY = Math.floor(115 - scaledH); // bottom aligned

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

    const filename = `${frameName}.png`;
    const filePath = path.join(outDir, filename);

    await sharp(targetBuffer, { raw: { width: targetSize, height: targetSize, channels: 4 } })
      .png()
      .toFile(filePath);

    extracted.push({ name: frameName, filename, filePath });
    console.log(`Saved ${filename} (${scaledW}x${scaledH})`);
  }

  // Build Master Monster Spritesheet
  console.log('\nGenerating monster_spritesheet.png and JSON...');
  const cols = 5;
  const rows = Math.ceil(extracted.length / cols);
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

  console.log(`\nMaster monster spritesheet created: ${sheetPath}`);
  console.log(`Atlas JSON created: ${jsonPath}`);
}

extractMonster().catch(console.error);
