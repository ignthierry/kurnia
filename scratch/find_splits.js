import sharp from 'sharp';

async function findSplitPoints() {
  const { data: rawData, info } = await sharp('Game/monster.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: fullW, height: fullH, channels } = info;
  const spriteYMin = 38;

  const colCounts = new Array(fullW).fill(0);
  for (let x = 0; x < fullW; x++) {
    for (let y = spriteYMin; y < fullH; y++) {
      const idx = (y * fullW + x) * channels;
      const r = rawData[idx];
      const g = rawData[idx + 1];
      const b = rawData[idx + 2];
      if (r < 235 || g < 235 || b < 235) {
        colCounts[x]++;
      }
    }
  }

  // Check Walk range 168..348
  console.log('Walk range 230..280 counts:');
  for (let x = 235; x <= 275; x++) {
    console.log(`x=${x}: count=${colCounts[x]}`);
  }

  // Check Attack range 363..531
  console.log('\nAttack range 420..470 counts:');
  for (let x = 430; x <= 465; x++) {
    console.log(`x=${x}: count=${colCounts[x]}`);
  }
}

findSplitPoints().catch(console.error);
