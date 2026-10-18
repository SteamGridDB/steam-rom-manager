import * as os from "os";
import * as fs from "fs-extra";
import * as probe from "probe-image-size";
import uri2path from "file-uri-to-path";

export function decodeFile(file_uri: string) {
  if (os.type() == "Windows_NT") {
    return uri2path(file_uri);
  }
  return decodeURIComponent(file_uri).split(":")[1];
}

// "<width>x<height>" of an image file. Sizes are in the first bytes of a
// file (rarely further, e.g. a JPEG after a big EXIF block): read those, not
// the whole (often megabytes) file.
export function imageDimensions(file_uri: string) {
  const file = decodeFile(file_uri);
  const head = Buffer.alloc(64 * 1024);
  const fd = fs.openSync(file, "r");
  let read: number;
  try {
    read = fs.readSync(fd, head, 0, head.length, 0);
  } finally {
    fs.closeSync(fd);
  }
  const result: any =
    probe.sync(head.subarray(0, read)) ??
    (read === head.length ? probe.sync(fs.readFileSync(file)) : null) ??
    {};
  return `${result.width || 0}x${result.height || 0}`;
}

export { encodeFile } from "./file-url";
