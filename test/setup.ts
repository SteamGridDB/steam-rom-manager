import { vi } from "vitest";
import * as fs from "fs";

// webpack loads src/lang/**/*.md as raw strings (webpack/markdown.ts); teach
// Node's require the same so the real language data loads in tests.
require.extensions[".md"] = (module: any, filename: string) => {
  module.exports = fs.readFileSync(filename, "utf8");
};

// The app installs these String.prototype helpers via side-effect imports in
// the renderer entry point (src/renderer/app.ts); lib code assumes they exist.
import "../src/lib/string-interpolation";
import "../src/lib/replace-diacritics";

// src/variables and src/paths resolve Electron's `app` at import time, which
// can't run in plain Node. Swap in equivalents backed by the real language
// data and a throwaway userData directory.
vi.mock("../src/variables", () => import("./stubs/variables"));
vi.mock("../src/paths", () => import("./stubs/paths"));

// The image-provider modules spin up DOM Workers / worker listeners on import
// and query SteamGridDB; replace them with recording, offline stubs.
vi.mock(
  "../src/lib/image-providers/index",
  () => import("./stubs/image-providers"),
);
vi.mock(
  "../src/lib/image-providers/steamgriddb.worker",
  () => import("./stubs/image-providers"),
);
vi.mock(
  "../src/lib/image-providers/steamcdn.worker",
  () => import("./stubs/image-providers"),
);
