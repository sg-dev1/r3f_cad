/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config) => {
    config.module.rules
      .find((k) => k.oneOf !== undefined)
      .oneOf.unshift({
        test: /\.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
        options: {
          name: 'static/js/[name].[contenthash:8].[ext]',
        },
      });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      perf_hooks: false,
      os: false,
      path: false,
      worker_threads: false,
      crypto: false,
      stream: false,
    };

    return config;
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
