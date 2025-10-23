/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  images: { domains: ["your-image-source.com"] },
};
export default nextConfig;