/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors fail the build. `npm run typecheck` is clean, so a regression
  // here is a real regression and should stop the deploy rather than ship.
  typescript: { ignoreBuildErrors: false },
  // Still skipped: this project has no ESLint dependency or config yet, so
  // enabling it would fail the build on a missing setup rather than on a real
  // lint finding. Add eslint + eslint-config-next first, then flip this.
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  outputFileTracingRoot: require('path').join(__dirname),
};

module.exports = nextConfig;
