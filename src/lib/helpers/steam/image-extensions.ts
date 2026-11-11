import * as os from "os";

export const map_ext: { [extension: string]: string } = {};

map_ext["jpg"] = "jpg";
map_ext["JPG"] = "jpg";
map_ext["jpeg"] = "jpg";
map_ext["JPEG"] = "jpg";
map_ext["png"] = "png";
map_ext["PNG"] = "png";
map_ext["tga"] = "tga";
map_ext["tga"] = "tga";
map_ext["ico"] = "ico";
map_ext["ICO"] = "ico";
// apparently there is a good reason for this:
map_ext["webp"] = "png";
map_ext["WEBP"] = "png";

// Images Windows can't show as a desktop shortcut's icon, but SRM can make
// an .ico of.
const toIcoExtensions = ["png", "jpg", "jpeg", "bmp", "gif"];

// The extension artwork from this url is saved with in the grid folder.
// Icons on Windows are saved as .ico: a desktop shortcut Steam makes shows
// the shortcut's icon (from shortcuts.vdf), and Windows can't show a PNG or
// JPEG there.
export function gridExtension(url: string, artworkType: string) {
  const ext = url
    .split(".")
    .slice(-1)[0]
    .replace(/[^\w\s]*$/gi, "");
  if (
    artworkType === "icon" &&
    os.type() == "Windows_NT" &&
    toIcoExtensions.includes(ext.toLowerCase())
  ) {
    return "ico";
  }
  return map_ext[ext] || ext;
}
