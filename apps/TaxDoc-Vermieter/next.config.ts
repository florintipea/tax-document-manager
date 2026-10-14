import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Stay isolated from parent tax-document-manager lockfile / middleware
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
