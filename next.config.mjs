import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  turbopack: { root },
  outputFileTracingRoot: root,
  outputFileTracingIncludes: {
    '/': ['./reference/dissolve.html'],
    '/[document]': ['./reference/pages/*.html'],
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/canethetoad', destination: '/', permanent: false },
      { source: '/work', destination: '/advertising', permanent: true },
      { source: '/:document([a-z0-9-]+).html', destination: '/:document', permanent: true },
    ];
  },
};

export default nextConfig;
