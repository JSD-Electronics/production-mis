/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  distDir: process.env.NEXTJS_DIST_DIR || ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizeCss: false,
    // Helps tree-shake large icon libs and other ESM packages.
    optimizePackageImports: ["lucide-react"],
  },
  // images: {
  //   domains: ["localhost"],
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    // Optional: disable webpack persistent caching to keep `.next/cache/webpack` small on servers.
    // Enable via: `set NEXT_DISABLE_WEBPACK_CACHE=1&& npm run build`
    if (!dev && process.env.NEXT_DISABLE_WEBPACK_CACHE === "1") {
      config.cache = false;
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: (() => {
          const isProd = process.env.NODE_ENV === "production";
          const override = process.env.NEXT_PUBLIC_API_PROXY_URL;
          const devBase = process.env.NEXT_PUBLIC_BASE_URL_DEV || "http://127.0.0.1:4000";
          const prodBase = process.env.NEXT_PUBLIC_BASE_URL_PROD || "http://34.205.96.179:4000";
          const base = isProd ? prodBase : (override || devBase);
          return `${base}/api/:path*`;
        })(),
      },
    ];
  },
};

export default nextConfig;
