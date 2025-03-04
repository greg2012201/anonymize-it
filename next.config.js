/** @type {import('next').NextConfig} */

module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      loader: "worker-loader",
      options: { inline: "no-fallback", esModule: true },
    });
    return config;
  },
};
