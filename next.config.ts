import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security/headers";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Keep Node-only deps out of the client/webpack graph (ioredis / pdf stack).
  serverExternalPackages: ['ioredis', 'pdf-parse', 'pdfjs-dist'],
  // persistence.ts / getDataDir() touch process.cwd() — do not NFT-trace deploy junk
  outputFileTracingExcludes: {
    '*': [
      './dist/**/*',
      './marketing/**/*',
      './docs/**/*',
      './.git/**/*',
      './node_modules/@swc/core*/**/*',
      './node_modules/webpack/**/*',
    ],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Experimental features for better performance
  experimental: {
    // Avoid optimizePackageImports for react-query/framer-motion — can break
    // client-hook dispatcher during Next 16 static prerender (useState null).
    optimizePackageImports: ['lucide-react', 'recharts'],
    serverActions: {
      bodySizeLimit: '100mb',
    },
    proxyClientMaxBodySize: '100mb',
    staticGenerationMaxConcurrency: 1,
  },


  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Turbopack handles code splitting automatically
    // Additional optimizations can be added here if needed
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
};

export default nextConfig;
