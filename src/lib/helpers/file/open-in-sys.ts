import * as child_process from "child_process";
export function dirOpen(dirPath: string) {
  let command = "";
  switch (process.platform) {
    case "darwin":
      command = `open "${dirPath}"`;
      break;
    case "win32":
      command = `start "" "${dirPath}"`;
      break;
    default:
      command = `xdg-open "${dirPath}"`;
      break;
  }
  return child_process.exec(command);
}
