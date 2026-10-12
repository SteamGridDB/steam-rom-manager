// A file path as a file:// URL (for <img>, Steam artwork urls).
export function encodeFile(file_path: string) {
  return encodeURI(`file:///${file_path.replace(/\\/g, "/")}`).replace(
    /#/g,
    "%23",
  );
}
