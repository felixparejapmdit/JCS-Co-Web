import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (fs.existsSync(standaloneDir)) {
  const srcStatic = path.join(rootDir, '.next', 'static');
  const destStatic = path.join(standaloneDir, '.next', 'static');

  if (fs.existsSync(srcStatic)) {
    console.log('[AOS100 Build] Copying .next/static to .next/standalone/.next/static...');
    fs.cpSync(srcStatic, destStatic, { recursive: true });
  }

  const srcPublic = path.join(rootDir, 'public');
  const destPublic = path.join(standaloneDir, 'public');

  if (fs.existsSync(srcPublic)) {
    console.log('[AOS100 Build] Copying public assets to .next/standalone/public...');
    fs.cpSync(srcPublic, destPublic, { recursive: true });
  }

  console.log('[AOS100 Build] Standalone assets synchronization complete.');
}
