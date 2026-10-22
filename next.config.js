/** @type {import('next').NextConfig} */
const nextConfig = {
  // NEXT_DIST_DIR lets the deep e2e sweep build next to a running `npm run dev` (playwright.deep.config.ts).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
