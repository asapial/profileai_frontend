/** Convert approved, UI-free imagegen scenes into lightweight website artwork. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import sharp from 'sharp';

const input = process.argv[2];
if (!input) throw new Error('Pass the generated-art source manifest.');
const sources = JSON.parse(readFileSync(resolve(input), 'utf8'));
const output = resolve('public/art/public-pages');
mkdirSync(output, { recursive: true });
const assets = [];
for (const source of sources) {
  if (!['templates', 'pricing', 'help', 'privacy', 'terms'].includes(source.kind) || !['dark', 'light'].includes(source.theme)) throw new Error('Unknown artwork.');
  const metadata = await sharp(source.input).metadata();
  for (const mobile of [false, true]) {
    let picture = sharp(source.input);
    if (mobile) {
      const left = Math.floor(metadata.width * .49);
      picture = picture.extract({ left, top: 0, width: metadata.width - left, height: metadata.height });
    }
    const file = `${source.kind}-${source.theme}${mobile ? '-mobile' : ''}.webp`;
    const { data, info } = await picture.resize({ width: mobile ? 900 : 1920, withoutEnlargement: true }).webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
    writeFileSync(join(output, file), data);
    assets.push({ file, width: info.width, height: info.height, bytes: data.length });
  }
}
writeFileSync(join(output, 'provenance.json'), JSON.stringify({
  method: 'Built-in image_gen, UI-free physical scene artwork based on the user-approved page mockups.',
  preparation: 'WebP conversion and a separate right-side mobile crop. No controls or policy text are baked into these backgrounds.',
  prompts: sources.map(({ kind, theme, prompt }) => ({ kind, theme, prompt })), assets,
}, null, 2));
console.log(JSON.stringify({ assets: assets.length, bytes: assets.reduce((total, asset) => total + asset.bytes, 0) }));
