/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Für Docker-Optimierung
  experimental: {
    // Optimierungen für Serverless
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
