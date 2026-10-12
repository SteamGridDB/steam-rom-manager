import { Configuration } from "webpack";
import merge from "webpack-merge";
import * as path from "path";
import * as helpers from "./helpers";

const jimpCommonjsEntry = path.join(
  path.dirname(require.resolve("jimp/package.json")),
  "dist",
  "commonjs",
  "index.js",
);

// The main process also hosts the core (headless CLI), so it bundles the
// same lib code as the renderer: language markdown, jimp, native sqlite.
let clientConfig: Configuration = {
  target: "electron-main",
  entry: {
    main: "./main/app.ts",
  },
  context: helpers.root("src"),
  output: {
    filename: "[name].bundle.js",
    path: helpers.root("dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      jimp$: jimpCommonjsEntry,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: ["ts-loader"],
      },
      {
        test: /\.md$/i,
        use: [helpers.root("webpack", "markdown.js")],
        type: "asset/source",
      },
      {
        // images referenced from the markdown docs
        test: /\.(gif|png|jpe?g|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: "renderer/images/[name][ext]",
        },
      },
    ],
  },
  node: false,
  externals: {
    "better-sqlite3": "commonjs better-sqlite3",
  },
};

let developmentConfig: Configuration = {
  mode: "development",
  devtool: "source-map",
  performance: {
    hints: false,
  },
  output: {
    devtoolModuleFilenameTemplate(info: any) {
      return "file:///" + encodeURI(info.absoluteResourcePath);
    },
  },
};

let productionConfig: Configuration = {
  mode: "production",
  bail: false,
};

// Runs in the sandboxed window before the UI; may only require "electron".
let preloadConfig: Configuration = {
  target: "electron-preload",
  entry: {
    preload: "./main/preload.ts",
  },
  context: helpers.root("src"),
  output: {
    filename: "[name].bundle.js",
    path: helpers.root("dist"),
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [{ test: /\.ts$/i, use: ["ts-loader"] }],
  },
  node: false,
};

const modeConfig =
  process.env.NODE_ENV === "production" ? productionConfig : developmentConfig;
module.exports = [
  merge(clientConfig, modeConfig),
  merge(preloadConfig, modeConfig),
];
