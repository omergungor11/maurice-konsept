import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';

const origin = 'https://mauricemoynihan.com/';
const publicDirectory = new URL('../public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../reference/assets.json', import.meta.url), 'utf8'));

function checksum(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function syncAsset([path, expected]) {
  const destination = new URL(path, publicDirectory);
  const existing = await readFile(destination).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (existing && checksum(existing) === expected) return false;

  const response = await fetch(new URL(path, origin), {
    headers: { referer: origin, 'user-agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (checksum(bytes) !== expected) throw new Error('SHA-256 checksum does not match the reference snapshot');

  const temporary = new URL(`${destination.href}.${process.pid}.download`);
  await mkdir(new URL('.', destination), { recursive: true });
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
  return true;
}

const errors = [];
let downloaded = 0;
let next = 0;

await Promise.all(Array.from({ length: 8 }, async () => {
  while (next < manifest.length) {
    const asset = manifest[next++];
    try {
      if (await syncAsset(asset)) downloaded++;
    } catch (error) {
      errors.push(`${asset[0]}: ${error.message}`);
    }
  }
}));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`${manifest.length} reference assets verified, ${downloaded} downloaded.`);
}
