import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fixes the "multiple lockfiles" warning when this project lives inside
    // a parent folder that contains other Node projects.
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
