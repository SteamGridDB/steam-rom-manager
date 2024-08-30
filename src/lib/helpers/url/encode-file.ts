import * as os from "os";
import * as fs from "fs-extra";
import * as probe from "probe-image-size";
import * as uri2path from "file-uri-to-path";

export function decodeFile(file_uri: string) {
  if (os.type() == "Windows_NT") {
    return uri2path(file_uri);
  }
  return decodeURIComponent(file_uri).split(":")[1];
}

export function imageDimensions(file_uri: string) {
  return ((result: any) => `${result.width || 0}x${result.height || 0}`)(
    probe.sync(fs.readFileSync(decodeFile(file_uri))) || {},
  );
}

export function encodeFile(file_path: string) {
  return encodeURI(`file:///${file_path.replace(/\\/g, "/")}`).replace(
    /#/g,
    "%23",
  );
}
