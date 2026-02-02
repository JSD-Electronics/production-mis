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
};

export default nextConfig;
