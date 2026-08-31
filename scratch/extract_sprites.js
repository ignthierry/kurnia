import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Remove white background by converting near-white pixels to transparent alpha.
 * Uses a smooth feathering curve near edges for crisp anti-aliasing.
 */
function makeTransparent(rawBuffer, width, height, channels) {
  const outBuffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = (y * width + x) * 4;

      const r = rawBuffer[srcIdx];
      const g = rawBuffer[srcIdx + 1];
      const b = rawBuffer[srcIdx + 2];

      // Calculate whiteness / brightness
      const minVal = Math.min(r, g, b);
      const maxVal = Math.max(r, g, b);
      const isNearWhite = r > 230 && g > 230 && b > 230 && (maxVal - minVal < 25);

      if (r > 248 && g > 248 && b > 248) {
        // Fully transparent
        outBuffer[dstIdx] = 0;
        outBuffer[dstIdx + 1] = 0;
        outBuffer[dstIdx + 2] = 0;
        outBuffer[dstIdx + 3] = 0;
      } else if (isNearWhite && minVal > 230) {
        // Soft alpha feathering for smooth edge anti-aliasing
        const alpha = Math.max(0, Math.min(255, Math.floor((248 - minVal) / 18 * 255)));
        outBuffer[dstIdx] = r;
        outBuffer[dstIdx + 1] = g;
        outBuffer[dstIdx + 2] = b;
        outBuffer[dstIdx + 3] = alpha;
      } else {
        // Opaque character pixel
        outBuffer[dstIdx] = r;
        outBuffer[dstIdx + 1] = g;
        outBuffer[dstIdx + 2] = b;
        outBuffer[dstIdx + 3] = 255;
      }
    }
  }

  return outBuffer;
}

/**
 * Find bounding box of non-transparent content inside raw RGBA buffer
 */
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

async function extractAllSprites() {
  const srcPath = 'Game/caracter.jpeg';
  const outDir = 'public/assets/game/character';
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Load raw image
  const { data: rawData, info } = await sharp(srcPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: fullW, height: fullH, channels } = info;

  // 1. Process entire image to transparent RGBA
  console.log('Processing transparency on full image...');
  const transparentFull = makeTransparent(rawData, fullW, fullH, channels);

  // 2. Define rows and approximate column regions (excluding text labels on the left: x < 250)
  // Let's scan each row for discrete sprites (columns)
  const rows = [
    { name: 'idle', yMin: 110, yMax: 410, expectedCount: 7 },
    { name: 'walk', yMin: 460, yMax: 730, expectedCount: 4 },
    { name: 'jump', yMin: 760, yMax: 1100, expectedCount: 5 },
    { name: 'attack', yMin: 1140, yMax: 1430, expectedCount: 5 },
    { name: 'dash', yMin: 1480, yMax: 1710, expectedCount: 3 },
    { name: 'special', yMin: 1740, yMax: 2010, expectedCount: 5 },
  ];

  const extractedFrames = [];

  for (const row of rows) {
    const rowH = row.yMax - row.yMin;
    const rowBuffer = Buffer.alloc(fullW * rowH * 4);

    // Copy row slice from transparentFull
    for (let y = 0; y < rowH; y++) {
      const srcY = row.yMin + y;
      const srcOffset = srcY * fullW * 4;
      const dstOffset = y * fullW * 4;
      transparentFull.copy(rowBuffer, dstOffset, srcOffset, srcOffset + fullW * 4);
    }

    // Ignore text on far left (x < 260)
    // Find column spans with content
    const colDensity = new Array(fullW).fill(0);
    for (let x = 260; x < fullW; x++) {
      for (let y = 0; y < rowH; y++) {
        const alpha = rowBuffer[(y * fullW + x) * 4 + 3];
        if (alpha > 40) colDensity[x]++;
      }
    }

    // Group active columns into sprite frames
    const spans = [];
    let inSpan = false;
    let spanStart = 0;
    let emptyCount = 0;

    for (let x = 260; x < fullW; x++) {
      if (colDensity[x] > 5) {
        if (!inSpan) {
          inSpan = true;
          spanStart = Math.max(260, x - 10);
        }
        emptyCount = 0;
      } else {
        if (inSpan) {
          emptyCount++;
          if (emptyCount > 25 || x === fullW - 1) {
            inSpan = false;
            const spanEnd = Math.min(fullW, x - emptyCount + 10);
            if (spanEnd - spanStart > 60) {
              spans.push({ startX: spanStart, endX: spanEnd });
            }
          }
        }
      }
    }

    console.log(`Row '${row.name}': found ${spans.length} frames`);

    // Extract each frame
    let frameIdx = 1;
    for (const span of spans) {
      const frameW = span.endX - span.startX;
      const frameBuffer = Buffer.alloc(frameW * rowH * 4);

      for (let y = 0; y < rowH; y++) {
        for (let x = 0; x < frameW; x++) {
          const srcIdx = (y * fullW + (span.startX + x)) * 4;
          const dstIdx = (y * frameW + x) * 4;
          frameBuffer[dstIdx] = rowBuffer[srcIdx];
          frameBuffer[dstIdx + 1] = rowBuffer[srcIdx + 1];
          frameBuffer[dstIdx + 2] = rowBuffer[srcIdx + 2];
          frameBuffer[dstIdx + 3] = rowBuffer[srcIdx + 3];
        }
      }

      // Get tight bounds
      const bounds = getTightBounds(frameBuffer, frameW, rowH);
      if (!bounds || bounds.width < 30 || bounds.height < 40) continue;

      // Extract tight sprite
      const tightBuffer = await sharp(frameBuffer, { raw: { width: frameW, height: rowH, channels: 4 } })
        .extract({ left: bounds.minX, top: bounds.minY, width: bounds.width, height: bounds.height })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Place onto standardized 160x160 transparent canvas (centered bottom-aligned for platformer physics)
      const targetSize = 160;
      const targetBuffer = Buffer.alloc(targetSize * targetSize * 4, 0);

      // Scale down slightly if needed to fit comfortably
      const maxDim = Math.max(bounds.width, bounds.height);
      const scale = maxDim > 140 ? 140 / maxDim : 1;
      const scaledW = Math.round(bounds.width * scale);
      const scaledH = Math.round(bounds.height * scale);

      const resized = await sharp(tightBuffer.data, { raw: { width: bounds.width, height: bounds.height, channels: 4 } })
        .resize(scaledW, scaledH, { fit: 'contain' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Center horizontally, bottom-align at y = 145
      const offsetX = Math.floor((targetSize - scaledW) / 2);
      const offsetY = Math.floor(145 - scaledH);

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

      const frameFilename = `${row.name}_${frameIdx}.png`;
      const outPath = path.join(outDir, frameFilename);

      await sharp(targetBuffer, { raw: { width: targetSize, height: targetSize, channels: 4 } })
        .png()
        .toFile(outPath);

      extractedFrames.push({
        category: row.name,
        frame: frameIdx,
        filename: frameFilename,
        path: outPath,
        width: targetSize,
        height: targetSize,
      });

      console.log(` -> Saved ${frameFilename} (${scaledW}x${scaledH})`);
      frameIdx++;
    }
  }

  // 3. Build unified spritesheet grid
  console.log(`\nBuilding master fairy spritesheet with ${extractedFrames.length} frames...`);
  const sheetCols = 8;
  const sheetRows = Math.ceil(extractedFrames.length / sheetCols);
  const frameDim = 160;
  const sheetW = sheetCols * frameDim;
  const sheetH = sheetRows * frameDim;
  const sheetBuffer = Buffer.alloc(sheetW * sheetH * 4, 0);

  const spritesheetJson = {
    frames: {},
    meta: {
      image: 'fairy_spritesheet.png',
      format: 'RGBA8888',
      size: { w: sheetW, h: sheetH },
      scale: '1',
    },
  };

  for (let i = 0; i < extractedFrames.length; i++) {
    const f = extractedFrames[i];
    const col = i % sheetCols;
    const row = Math.floor(i / sheetCols);
    const startX = col * frameDim;
    const startY = row * frameDim;

    const frameData = await sharp(f.path)
      .raw()
      .toBuffer({ resolveWithObject: true });

    for (let y = 0; y < frameDim; y++) {
      for (let x = 0; x < frameDim; x++) {
        const srcIdx = (y * frameDim + x) * 4;
        const dstIdx = ((startY + y) * sheetW + (startX + x)) * 4;
        sheetBuffer[dstIdx] = frameData.data[srcIdx];
        sheetBuffer[dstIdx + 1] = frameData.data[srcIdx + 1];
        sheetBuffer[dstIdx + 2] = frameData.data[srcIdx + 2];
        sheetBuffer[dstIdx + 3] = frameData.data[srcIdx + 3];
      }
    }

    const key = `${f.category}_${f.frame}`;
    spritesheetJson.frames[key] = {
      frame: { x: startX, y: startY, w: frameDim, h: frameDim },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameDim, h: frameDim },
      sourceSize: { w: frameDim, h: frameDim },
    };
  }

  const sheetPath = path.join(outDir, 'fairy_spritesheet.png');
  await sharp(sheetBuffer, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .png()
    .toFile(sheetPath);

  const jsonPath = path.join(outDir, 'fairy_spritesheet.json');
  fs.writeFileSync(jsonPath, JSON.stringify(spritesheetJson, null, 2));

  console.log(`\nSpritesheet created at: ${sheetPath} (${sheetW}x${sheetH})`);
  console.log(`JSON metadata created at: ${jsonPath}`);
  console.log(`Total extracted frames: ${extractedFrames.length}`);
}

extractAllSprites().catch(console.error);
