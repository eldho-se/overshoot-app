const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the tracing root to this project to avoid
  // Next.js mis-detecting a higher-level lockfile as the workspace root.
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;

