/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
    turbo: {
      loaders: {
        '.png': ['file-loader'],
        '.jpg': ['file-loader'],
        '.jpeg': ['file-loader'],
        '.gif': ['file-loader'],
        '.svg': ['file-loader']
      }
    }
  },
  images: {
    domains: ['ipfs.io', 'gateway.ipfs.io'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp']
  },
  webpack: (config, { dev, isServer }) => {
    config.externals = config.externals || [];
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      assert: require.resolve('assert'),
      os: require.resolve('os-browserify'),
      path: require.resolve('path-browserify'),
      'process/browser': require.resolve('process/browser')
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        'node-fetch': require.resolve('node-fetch'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        assert: require.resolve('assert'),
        url: require.resolve('url'),
        process: require.resolve('process/browser')
      }
    }

    if (!dev && !isServer) {
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 400000,
        maxAssetSize: 400000,
      }
    }

    return config;
  },
  transpilePackages: [
    "@walletconnect/modal",
    "@walletconnect/ethereum-provider",
    "@walletconnect/sign-client",
    "@walletconnect/modal-ui",
    "@walletconnect/utils",
    "@walletconnect/types",
    "@web3modal/standalone",
    "face-api.js"
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
