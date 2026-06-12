import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const frontendDir = resolve(repoRoot, 'frontend');
const spaDist = resolve(frontendDir, 'dist');
const nginxHtml = resolve(here, '../nginx/html');

console.log('[build:spa] building SPA in', frontendDir);
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('[build:spa] replacing contents of', nginxHtml);

mkdirSync(nginxHtml, { recursive: true });
for (const entry of readdirSync(nginxHtml)) {
  if (entry === '.gitkeep') continue;
  rmSync(resolve(nginxHtml, entry), { recursive: true, force: true });
}
cpSync(spaDist, nginxHtml, { recursive: true });

console.log('[build:spa] SPA bundled into nginx/html');
