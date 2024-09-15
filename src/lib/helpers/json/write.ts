import * as fs from "fs-extra";

export function write(filename: string, value: any, replacer?: any) {
  return new Promise<void>((resolve, reject) => {
    try {
      fs.outputJsonSync(filename, value, {
        spaces: "\t",
        EOL: "\r\n",
        replacer,
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}
