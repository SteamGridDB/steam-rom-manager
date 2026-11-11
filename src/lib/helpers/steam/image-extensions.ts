export const map_ext: { [extension: string]: string } = {};

map_ext["jpg"] = "jpg";
map_ext["JPG"] = "jpg";
map_ext["jpeg"] = "jpg";
map_ext["JPEG"] = "jpg";
map_ext["png"] = "png";
map_ext["PNG"] = "png";
map_ext["tga"] = "tga";
map_ext["tga"] = "tga";
// Steam on Linux ignores shortcut icons stored as ICO; save a PNG instead.
map_ext["ico"] = process.platform === "linux" ? "png" : "ico";
map_ext["ICO"] = process.platform === "linux" ? "png" : "ico";
// apparently there is a good reason for this:
map_ext["webp"] = "png";
map_ext["WEBP"] = "png";
