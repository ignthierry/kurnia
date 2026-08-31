import sharp from 'sharp';

async function inspectMonster() {
  const metadata = await sharp('Game/monster.png').metadata();
  console.log('Monster Image Metadata:', metadata);

  const { data, info } = await sharp('Game/monster.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Dimensions: ${info.width}x${info.height}, channels: ${info.channels}`);

  // Sample corners & top
  const sample = (x, y) => {
    const idx = (y * info.width + x) * info.channels;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  console.log('Top-left:', sample(10, 10));
  console.log('Top-right:', sample(info.width - 10, 10));
  console.log('Bottom-left:', sample(10, info.height - 10));
  console.log('Center top (header text area):', sample(Math.floor(info.width / 2), 20));
}

inspectMonster().catch(console.error);
