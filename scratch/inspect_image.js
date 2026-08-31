import sharp from 'sharp';
import fs from 'fs';

async function inspect() {
  const metadata = await sharp('Game/caracter.jpeg').metadata();
  console.log('Metadata:', metadata);

  const { data, info } = await sharp('Game/caracter.jpeg')
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Image info: ${info.width}x${info.height}, channels: ${info.channels}`);

  // Sample corner pixels to check background color
  const sample = (x, y) => {
    const idx = (y * info.width + x) * info.channels;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  console.log('Top-left corner:', sample(10, 10));
  console.log('Top-right corner:', sample(info.width - 10, 10));
  console.log('Bottom-left corner:', sample(10, info.height - 10));
  console.log('Center:', sample(Math.floor(info.width / 2), Math.floor(info.height / 2)));
}

inspect().catch(console.error);
