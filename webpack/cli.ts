import { Configuration, RuleSetRule, optimize } from "webpack";
import * as helpers from "./helpers";

// The standalone command line: the main process' code for plain Node (no
// Electron), as one file (dist-cli/srm.js) that scripts/build-cli.ts turns
// into an executable per platform.
const [mainConfig]: Configuration[] = require("./main");

const cliConfig: Configuration = {
  ...mainConfig,
  target: "node",
  entry: { srm: "./main/cli-standalone.ts" },
  output: {
    ...mainConfig.output,
    filename: "[name].js",
    path: helpers.root("dist-cli"),
  },
  module: {
    ...mainConfig.module,
    // The language docs' images: the window shows them, the command line
    // doesn't (the references still resolve; the files aren't written).
    rules: (mainConfig.module.rules as RuleSetRule[]).map((rule) =>
      rule.type === "asset/resource"
        ? { ...rule, generator: { ...rule.generator, emit: false } }
        : rule,
    ),
  },
  externals: {
    ...(mainConfig.externals as object),
    // never loaded here (paths.ts only asks Electron when inside it)
    electron: "commonjs electron",
  },
  plugins: [
    ...(mainConfig.plugins ?? []),
    // One file: an executable can't load chunks from beside itself.
    new optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
  ],
};

module.exports = cliConfig;
