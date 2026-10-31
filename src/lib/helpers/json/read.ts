import * as fs from "fs-extra";

// Reads a JSON file; a missing or empty one gives `fallback` (or null).
// (An empty file is what a crash mid-save left behind before writes were
// atomic: it holds nothing to protect, so it doesn't count as corrupt.)
export function read<T>(file: string, fallback?: T) {
  return Promise.resolve().then(() =>
    fs
      .readFile(file, "utf8")
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          return "";
        } else {
          throw error;
        }
      })
      .then((text) => {
        const data =
          text.trim() === ""
            ? undefined
            : parse(file, text);
        if (data === undefined) {
          return fallback || null;
        } else {
          return (data as T) || null;
        }
      }),
  );
}

// (like fs-extra's readJson: a BOM is skipped, the error names the file)
function parse(file: string, text: string) {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    error.message = `${file}: ${error.message}`;
    throw error;
  }
}
