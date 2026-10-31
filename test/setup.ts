import { vi } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// webpack loads src/lang/**/*.md as raw strings (webpack/markdown.ts); teach
// Node's require the same so the real language data loads in tests.
require.extensions[".md"] = (module: any, filename: string) => {
  module.exports = fs.readFileSync(filename, "utf8");
};

// src/paths reads SRM's data directory from here (as the CLI does); a fresh
// temp dir per test file means tests never touch a real SRM install.
process.env.SRM_USER_DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "srm-test-userData-"),
);

// Never let a test kill or relaunch the Steam client on the host machine.
vi.mock(
  "../src/lib/helpers/steam/stop-start-steam",
  () => import("./stubs/stop-start-steam"),
);

// SteamGridDB lookups go over the network; use a recording, offline stub.
vi.mock(
  "../src/lib/image-providers/sgdb-search",
  () => import("./stubs/sgdb-search"),
);
