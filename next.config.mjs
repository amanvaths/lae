/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubPages ? "/lae" : "",
  assetPrefix: isGithubPages ? "/lae/" : "",
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ["three"],
  webpack: (config) => {
    // Silence optional React-Native-only deps pulled in by wallet SDKs
    // (MetaMask SDK, WalletConnect) that are never used on the web.
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
