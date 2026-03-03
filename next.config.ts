import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mammoth", "openai", "jszip"],
};

export default nextConfig;
