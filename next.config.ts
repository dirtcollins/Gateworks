import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
      }
    ]
  }
};

export default nextConfig;
