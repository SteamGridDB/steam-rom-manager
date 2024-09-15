import * as path from "path";
import * as fs from "fs-extra";

export function backup(
  filepath: string,
  ext: string,
  overwrite: boolean = false,
) {
  let newFilepath = path.join(
    path.dirname(filepath),
    path.basename(filepath, path.extname(filepath)),
  );
  if (ext[0] === ".") newFilepath += ext;
  else newFilepath = `${newFilepath}.${ext}`;

  return fs.copy(filepath, newFilepath, { overwrite: overwrite }).then();
}
