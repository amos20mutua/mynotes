/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.88.82", "127.0.0.1", "localhost"],
  devIndicators: false,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
