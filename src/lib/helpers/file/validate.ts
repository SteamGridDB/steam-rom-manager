import * as fs from "fs-extra";
import * as path from "path";
export function validatePath(fsPath: string, checkForDirectory?: boolean) {
  try {
    let pathStat = fs.statSync(fsPath);
    if (checkForDirectory !== undefined)
      return checkForDirectory ? pathStat.isDirectory() : pathStat.isFile();
    else return true;
  } catch (e) {
    if (process.env["IN_FLATPAK"]) {
      try {
        let pathStat = fs.statSync(path.join("/var/run/host", fsPath));
        if (checkForDirectory !== undefined)
          return checkForDirectory ? pathStat.isDirectory() : pathStat.isFile();
        else return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
}
