import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function cropAndExtract() {
  const img = sharp('Game/caracter.jpeg');
  const metadata = await img.metadata();
  const { width, height } = metadata;

  // Let's create an output folder
  const outDir = 'public/assets/game/character_frames';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Define rows based on the clusters
  // Row 1: y ~ 100..420 (Idle / Walk 1)
  // Row 2: y ~ 450..740 (Walk / Run)
  // Row 3: y ~ 750..1100 (Jump / Flutter)
  // Row 4: y ~ 1100..1430 (Attack / Shoot)
  // Row 5: y ~ 1450..1720 (Hurt / Fall)
  // Row 6: y ~ 1720..2020 (Die / Special)

  const rows = [
    { name: 'row1_idle_walk', yMin: 100, yMax: 430 },
    { name: 'row2_run', yMin: 450, yMax: 740 },
    { name: 'row3_jump', yMin: 750, yMax: 1100 },
    { name: 'row4_attack', yMin: 1120, yMax: 1440 },
    { name: 'row5_dash_hurt', yMin: 1460, yMax: 1720 },
    { name: 'row6_down', yMin: 1730, yMax: 2020 },
  ];

  for (const row of rows) {
    const rowCrop = await sharp('Game/caracter.jpeg')
      .extract({ left: 0, top: row.yMin, width: width, height: row.yMax - row.yMin })
      .toFile(path.join(outDir, `${row.name}.jpg`));
    console.log(`Saved ${row.name}`);
  }
}

cropAndExtract().catch(console.error);
