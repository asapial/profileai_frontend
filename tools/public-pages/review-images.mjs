/** Contact sheets show unchanged real captures, with every inspector image. */
import sharp from 'sharp';
import { mkdirSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const root = resolve('../tmp/public-inspect-complete');
const output = resolve('../tmp/public-page-review'); mkdirSync(output, { recursive: true });
const manifest = [];
for (const route of ['templates', 'pricing', 'help', 'privacy', 'terms']) {
  const directory = join(root, route), parts = [], columns = [0, 0, 0];
  const files = readdirSync(directory).filter(file => /^(desktop|tablet|mobile)-(fold|page-\d+)\.jpg$/.test(file)).sort();
  for (const file of files) {
    const column = file.startsWith('desktop') ? 0 : file.startsWith('tablet') ? 1 : 2;
    const picture = sharp(join(directory, file));
    const metadata = await picture.metadata(), width = Math.min(640, metadata.width);
    const { data, info } = await picture.resize({ width }).toBuffer({ resolveWithObject: true });
    parts.push({ input: data, left: 16 + column * 656 + Math.round((640 - info.width) / 2), top: 16 + columns[column] });
    columns[column] += info.height + 16;
  }
  const path = join(output, `${route}-inspector.jpg`);
  await sharp({ create: { width: 1984, height: Math.max(...columns) + 16, channels: 3, background: '#20222b' } }).composite(parts).jpeg({ quality: 90 }).toFile(path);
  manifest.push({ route, files, contact: path });
}
const captures = resolve('../tmp/public-pages-complete');
if (existsSync(join(captures, 'templates-light-1440-page.jpg'))) {
  const parts = [];
  let height = 0;
  for (const [index, theme] of ['dark', 'light'].entries()) {
    const { data, info } = await sharp(join(captures, `templates-${theme}-1440-page.jpg`)).resize({ width: 960 }).jpeg({ quality: 90 }).toBuffer({ resolveWithObject: true });
    parts.push({ input: data, left: index * 960, top: 0 }); height = Math.max(height, info.height);
  }
  await sharp({ create: { width: 1920, height, channels: 3, background: '#f7f6fb' } }).composite(parts).jpeg({ quality: 90 }).toFile(join(output, 'actual-templates-both-themes.jpg'));
}
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest.map(item => ({ route: item.route, images: item.files.length, contact: item.contact }))));
