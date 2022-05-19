import * as fs from 'fs-extra';

export function validatePath(fsPath: string, checkForDirectory?: boolean) {
  try {
    let path = fs.statSync(fsPath);
    if (checkForDirectory !== undefined)
      return checkForDirectory ? path.isDirectory() : path.isFile();
    else
      return true;
  } catch (e) {
    if (process.env["IN_FLATPAK"]) {
      try {
        let path = fs.statSync("/var/run/host" + fsPath);
        if (checkForDirectory !== undefined)
          return checkForDirectory ? path.isDirectory() : path.isFile();
        else
          return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
}
