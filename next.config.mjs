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
        destination: process.env.NODE_ENV === "production"
          ? "http://34.205.96.179:8000/api/:path*"
          : "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
