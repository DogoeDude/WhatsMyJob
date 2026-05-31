import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep Better Auth / Prisma out of Turbopack bundle (fixes kysely adapter errors)
  serverExternalPackages: [
    'better-auth',
    '@better-auth/core',
    '@better-auth/kysely-adapter',
    'kysely',
    '@prisma/client',
    'prisma',
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
