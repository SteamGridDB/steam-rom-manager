import * as fs from "fs-extra";

export function read<T>(file: string, fallback?: T) {
  return Promise.resolve().then(() =>
    fs
      .readJson(file, { throws: true })
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          return undefined;
        } else {
          throw error;
        }
      })
      .then((data) => {
        if (data === undefined) {
          return fallback || null;
        } else {
          return (data as T) || null;
        }
      }),
  );
}
