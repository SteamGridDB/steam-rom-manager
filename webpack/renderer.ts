// import * as HtmlWebpackPlugin from 'html-webpack-plugin';
// import * as MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import { merge } from "webpack-merge";
import { Configuration } from "webpack";

import * as helpers from "./helpers";

let clientConfig: Configuration = {
  target: "electron-renderer",
  entry: {
    renderer: "./renderer/app.ts",
  },
  context: helpers.root("src"),
  output: {
    filename: "[name].bundle.js",
    path: helpers.root("dist", "renderer"),
    publicPath: "./",
    chunkFilename: "[chunkhash].bundle.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: ["ts-loader", "angular2-template-loader"],
      },
      {
        test: /global\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // below at `new MiniCssExtractPlugin` we add `styles/` to the path,
              // so we need to remove it here again, so relative resources can be found
              publicPath: "../",
            },
          },
          "css-loader",
          "postcss-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.scss$/i,
        use: [
          "to-string-loader",
          "css-loader",
          "postcss-loader",
          "sass-loader",
        ],
        exclude: /global\.scss$/,
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name][ext]",
        },
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name][ext]",
        },
      },
      {
        test: /\.html$/i,
        use: ["to-string-loader", "html-loader"],
      },
      {
        test: /\.md$/i,
        use: [helpers.root("webpack", "markdown.js")],
        type: "asset/source",
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles/globalStyles.css",
    }),
    new HtmlWebpackPlugin({
      filename: helpers.root("dist", "renderer", "index.html"),
      template: helpers.root("src", "renderer", "index.html"),
    }),
  ],
  node: false,
  externals: {
    "better-sqlite3": "commonjs better-sqlite3",
  },
};

let developmentConfig: Configuration = {
  mode: "development",
  devtool: "eval-cheap-module-source-map",
  performance: {
    hints: false,
  },
  output: {
    devtoolModuleFilenameTemplate: function (info: any) {
      return "file:///" + encodeURI(info.absoluteResourcePath);
    },
  },
};

let productionConfig: Configuration = {
  mode: "production",
  bail: false,
};

if (process.env.NODE_ENV === "production")
  module.exports = merge(clientConfig, productionConfig);
else module.exports = merge(clientConfig, developmentConfig);
