// One-time script: resize icon-512x512.png into all required PWA icon sizes
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = 'C:/Users/bpska/.gemini/antigravity-ide/brain/8522ac1e-4054-45ed-8243-1c0ddf62c6c4/pwa_icon_512_1781239864456.png';
const publicDir = path.join(__dirname, '../public');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
    console.log(`✅ icon-${size}x${size}.png`);
  }

  // Maskable icons: add 20% safe-zone padding (white bg)
  for (const size of [192, 512]) {
    const padding = Math.round(size * 0.1);
    const innerSize = size - padding * 2;
    await sharp(src)
      .resize(innerSize, innerSize)
      .extend({
        top: padding, bottom: padding, left: padding, right: padding,
        background: { r: 255, g: 251, b: 241, alpha: 1 } // #FFFBF1
      })
      .png()
      .toFile(path.join(publicDir, `icon-${size}x${size}-maskable.png`));
    console.log(`✅ icon-${size}x${size}-maskable.png`);
  }

  // Apple splash / touch icon at 180
  await sharp(src)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png');

  console.log('\n🎉 All PWA icons generated!');
}

generate().catch(console.error);
