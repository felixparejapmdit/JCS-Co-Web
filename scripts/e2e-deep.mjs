// Runs the deep button sweep (e2e/deep, playwright.deep.config.ts): builds the app into .next-e2e,
// so a running `npm run dev` keeps its .next, then runs the sweep on its own server (port 8190).
//   npm run test:e2e:deep [-- playwright options, e.g. -g "doc/jv"]
//   npm run test:e2e:deep -- --no-build     (reuse the last .next-e2e build)
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const args = process.argv.slice(2);
const noBuild = args.includes('--no-build');
const env = { ...process.env, NEXT_DIST_DIR: '.next-e2e' };
if (!noBuild) {
  // next build adds its folder to tsconfig.json and next-env.d.ts; keep them as they are in git.
  const keep = ['tsconfig.json', 'next-env.d.ts'].filter((f) => fs.existsSync(f)).map((f) => [f, fs.readFileSync(f)]);
  try {
    execSync('npx next build', { stdio: 'inherit', env });
  } finally {
    for (const [f, body] of keep) fs.writeFileSync(f, body);
  }
}
const rest = args.filter((a) => a !== '--no-build').map((a) => JSON.stringify(a)).join(' ');
try {
  execSync(`npx playwright test --config playwright.deep.config.ts ${rest}`, { stdio: 'inherit', env });
} catch (e) {
  process.exit(e.status ?? 1);
}
