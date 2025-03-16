/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Handle WalletConnect and other Web3 packages that have issues with SSR
    config.externals = config.externals || [];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Ensure config.resolve and config.resolve.alias exist
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Add condition to check for browser environment
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    };
    
    return config;
  },
  // Necessary transpilation for certain packages
  transpilePackages: [
    "@walletconnect/modal",
    "@walletconnect/ethereum-provider",
    "@walletconnect/sign-client",
    "@walletconnect/modal-ui",
    "@walletconnect/utils",
    "@walletconnect/types",
    "@web3modal/standalone"
  ],
};

module.exports = nextConfig;
