import { Configuration } from "webpack";
import merge from "webpack-merge";
import * as helpers from "./helpers";

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
  },
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: ["ts-loader"],
      },
    ],
  },
  node: false,
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

if (process.env.NODE_ENV === "production") {
  module.exports = merge(clientConfig, productionConfig);
} else {
  module.exports = merge(clientConfig, developmentConfig);
}
