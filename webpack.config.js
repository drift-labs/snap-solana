// @ts-check

const webpack = require("webpack");
const path = require("path");
const { SnapsWebpackPlugin } = require("./snaps-webpack-plugin/plugin.js"); //require("@metamask/snaps-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";

const config = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    host: "localhost",
    port: 8080,
  },
  performance: {
    hints: false,
    maxEntrypointSize: 2000000,
    maxAssetSize: 2000000,
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    // @ts-ignore
    new SnapsWebpackPlugin({
      stripComments: true,
      eval: true,
      manifestPath: "./snap.manifest.json",
      writeManifest: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
    fallback: {
      buffer: require.resolve("buffer"),
    },
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
