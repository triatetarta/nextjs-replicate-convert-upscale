/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
    reactStrictMode: false,
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
