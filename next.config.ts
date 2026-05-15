import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1536],
    imageSizes: [32, 48, 64, 96, 128, 192, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    qualities: [45, 60, 75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.national-hardware.com"
      },
      {
        protocol: "https",
        hostname: "www.national-hardware.com"
      },
      {
        protocol: "https",
        hostname: "mobileimages.lowes.com"
      },
      {
        protocol: "https",
        hostname: "www.hooverfence.com"
      },
      {
        protocol: "https",
        hostname: "images.thdstatic.com"
      },
      {
        protocol: "https",
        hostname: "www.milwaukeetool.com"
      }
    ]
  }
};

export default nextConfig;
