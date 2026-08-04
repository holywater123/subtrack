import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // scanReceipt sends the raw photo file through a server action -
      // the 1MB default is smaller than a typical phone camera photo.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
