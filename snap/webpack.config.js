// @ts-check

const webpack = require("webpack");
const path = require("path");

const { SnapsWebpackPlugin } = require("./snaps-webpack-plugin/plugin.js");
// const SnapsWebpackPlugin = require("@metamask/snaps-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";

const WebpackShellPluginNext = require("webpack-shell-plugin-next");

const plugins = [
  new webpack.ProvidePlugin({
    Buffer: ["buffer", "Buffer"],
  }),
  new SnapsWebpackPlugin({
    stripComments: true,
  }),
];

if (!isProduction) {
  plugins.push(
    // @ts-ignore
    new WebpackShellPluginNext({
      onBuildEnd: {
        scripts: ["yarn serve"],
        blocking: false,
        parallel: true,
      },
    }),
  );
}

const config = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    libraryTarget: "commonjs2",
  },
  // development mode doesn't work with mm snap's SES eval apparently
  mode: "production",
  // devServer doesn't work with it either, so no devServer, just using server.ts
  performance: {
    hints: false,
    maxEntrypointSize: 2000000,
    maxAssetSize: 2000000,
  },
  plugins,
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
  return config;
};
