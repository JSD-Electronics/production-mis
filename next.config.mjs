/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
  // images: {
  //   domains: ["localhost"],
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  reactStrictMode: false,
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
