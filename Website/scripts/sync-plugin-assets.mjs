import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const svnAssetsDir = path.join(repoRoot, 'SVN', 'assets');

const requiredAssets = [
  'banner-1544x500.png',
  'screenshot-1.jpg',
  'screenshot-2.jpg',
  'screenshot-3.jpg',
  'favicon.svg',
  'favicon-32x32.png',
  'favicon-16x16.png',
];

async function main() {
  for (const assetName of requiredAssets) {
    await fs.access(path.join(svnAssetsDir, assetName));
  }

  console.log('Validated tags-reindex assets in SVN/assets');
}

main().catch((error) => {
  console.error('Failed to sync tags-reindex plugin asset:', error);
  process.exit(1);
});
