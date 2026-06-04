import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next from using C:\Users\Reji\ as the monorepo root (wrong lockfile).
  outputFileTracingRoot: projectRoot,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.google.com', pathname: '/s2/favicons/**' },
      { protocol: 'https', hostname: 'ui-avatars.com', pathname: '/api/**' },
      { protocol: 'https', hostname: 'icons.duckduckgo.com', pathname: '/**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  // Prisma + auth: keep server bundles from pulling broken optional peers.
  serverExternalPackages: ['@prisma/client', 'prisma', 'better-auth'],
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      kysely: path.join(projectRoot, 'node_modules', 'kysely'),
    },
  },
};

export default nextConfig;
