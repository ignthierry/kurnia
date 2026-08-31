import sharp from 'sharp';
import fs from 'fs';

async function analyzeSprites() {
  const { data, info } = await sharp('Game/caracter.jpeg')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Let's create a low-res density map (e.g. 64x64 or 128x128 blocks)
  const blockSize = 16;
  const gridW = Math.floor(width / blockSize);
  const gridH = Math.floor(height / blockSize);
  const grid = Array.from({ length: gridH }, () => new Array(gridW).fill(0));

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      let nonWhiteCount = 0;
      for (let y = gy * blockSize; y < (gy + 1) * blockSize; y++) {
        for (let x = gx * blockSize; x < (gx + 1) * blockSize; x++) {
          const idx = (y * width + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // If not near-white
          if (r < 240 || g < 240 || b < 240) {
            nonWhiteCount++;
          }
        }
      }
      if (nonWhiteCount > (blockSize * blockSize) * 0.05) {
        grid[gy][gx] = 1;
      }
    }
  }

  // Print ascii density map
  console.log('ASCII Map of Sprite Locations:');
  for (let gy = 0; gy < gridH; gy += 2) {
    let line = '';
    for (let gx = 0; gx < gridW; gx += 2) {
      line += grid[gy][gx] ? '#' : '.';
    }
    console.log(line);
  }

  // Find connected components / clusters
  const visited = Array.from({ length: gridH }, () => new Array(gridW).fill(false));
  const clusters = [];

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      if (grid[gy][gx] && !visited[gy][gx]) {
        let minX = gx, maxX = gx, minY = gy, maxY = gy;
        let count = 0;
        const queue = [[gx, gy]];
        visited[gy][gx] = true;

        while (queue.length > 0) {
          const [cx, cy] = queue.pop();
          count++;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          const neighbors = [
            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
            [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH && grid[ny][nx] && !visited[ny][nx]) {
              visited[ny][nx] = true;
              queue.push([nx, ny]);
            }
          }
        }

        if (count > 8) {
          clusters.push({
            minX: minX * blockSize,
            maxX: (maxX + 1) * blockSize,
            minY: minY * blockSize,
            maxY: (maxY + 1) * blockSize,
            count
          });
        }
      }
    }
  }

  console.log(`\nFound ${clusters.length} sprite clusters:`);
  clusters.sort((a, b) => {
    // Sort top-to-bottom, left-to-right
    if (Math.abs(a.minY - b.minY) > 200) {
      return a.minY - b.minY;
    }
    return a.minX - b.minX;
  });

  clusters.forEach((c, idx) => {
    console.log(`Cluster ${idx + 1}: x=${c.minX}..${c.maxX} (w=${c.maxX - c.minX}), y=${c.minY}..${c.maxY} (h=${c.maxY - c.minY})`);
  });
}

analyzeSprites().catch(console.error);
