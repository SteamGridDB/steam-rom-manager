import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    // File-parser runs glob over real temp directories; give it room on CI.
    testTimeout: 30000,
  },
});
