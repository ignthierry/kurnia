import sharp from 'sharp';

async function findExactSpans() {
  const { data: rawData, info } = await sharp('Game/monster.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: fullW, height: fullH, channels } = info;
  const spriteYMin = 36;
  const spriteH = fullH - spriteYMin;

  const colCounts = new Array(fullW).fill(0);
  for (let x = 0; x < fullW; x++) {
    for (let y = spriteYMin; y < fullH; y++) {
      const idx = (y * fullW + x) * channels;
      const r = rawData[idx];
      const g = rawData[idx + 1];
      const b = rawData[idx + 2];
      if (r < 240 || g < 240 || b < 240) {
        colCounts[x]++;
      }
    }
  }

  // Print non-zero column profile
  let segments = [];
  let segStart = -1;
  for (let x = 0; x < fullW; x++) {
    if (colCounts[x] > 2) {
      if (segStart === -1) segStart = x;
    } else {
      if (segStart !== -1) {
        segments.push({ start: segStart, end: x - 1, len: x - segStart });
        segStart = -1;
      }
    }
  }
  if (segStart !== -1) segments.push({ start: segStart, end: fullW - 1, len: fullW - segStart });

  console.log(`Found ${segments.length} column segments:`, segments);
}

findExactSpans().catch(console.error);
