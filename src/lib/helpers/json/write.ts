import * as fs from "fs-extra";
import * as path from "path";

// Writes `text` so that the file is never left half-written: to a temporary
// file next to it, then renamed over it (a crash or power loss mid-write
// leaves the old file whole).
export function writeFileAtomicSync(filename: string, text: string) {
  fs.ensureDirSync(path.dirname(filename));
  const temp = `${filename}.tmp`;
  fs.writeFileSync(temp, text);
  fs.renameSync(temp, filename);
}

export function write(filename: string, value: any, replacer?: any) {
  return new Promise<void>((resolve, reject) => {
    try {
      // (the format fs-extra's outputJson wrote: tabs, CRLF)
      writeFileAtomicSync(
        filename,
        JSON.stringify(value, replacer, "\t").replace(/\n/g, "\r\n") + "\r\n",
      );
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
