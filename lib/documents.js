import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = join(process.cwd(), 'reference', 'pages');
const names = new Set(
  readdirSync(directory)
    .filter((filename) => filename.endsWith('.html'))
    .map((filename) => filename.slice(0, -'.html'.length)),
);

export function listDocuments() {
  return [...names].sort();
}

export function getDocument(name) {
  if (!names.has(name)) return null;
  return readFileSync(join(directory, name + '.html'), 'utf8');
}
