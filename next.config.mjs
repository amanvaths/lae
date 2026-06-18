/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const isVpsStatic = process.env.NEXT_STATIC_EXPORT === "true";
const isStaticExport = isGithubPages || isVpsStatic;
const basePath = isGithubPages ? "/lae" : "";

const nextConfig = {
  // Static export for GitHub Pages and VPS nginx deploy — not during `next dev`
  ...(isStaticExport ? { output: "export", trailingSlash: true } : {}),
  devIndicators: false,
  basePath,
  assetPrefix: isGithubPages ? "/lae/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ["three"],
  webpack: (config, { dev }) => {
    if (dev) {
      // Named chunk ids reduce HMR "Cannot find module './NNNN.js'" mismatches
      config.optimization = {
        ...config.optimization,
        moduleIds: "named",
        chunkIds: "named",
      };
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
