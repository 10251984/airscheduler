/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig = {
  ...(process.env.STATIC_EXPORT === "true" ? { output: "export" } : {}),
  basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
  images: { unoptimized: true },
};

module.exports = nextConfig;
