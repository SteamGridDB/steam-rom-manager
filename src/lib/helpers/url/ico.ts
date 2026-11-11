const { Jimp } = require("jimp");

// The sizes Windows picks from for desktop, list and taskbar icons (up to
// the image's own size: no bigger than 256, the most an .ico holds).
const icoSizes = [256, 64, 48, 32, 24, 16];

export function isIco(buffer: Buffer) {
  return buffer.length >= 4 && buffer.readUInt32LE(0) === 0x00010000;
}

// An .ico of an image (PNG, JPEG, BMP, GIF): a PNG of each size, made square
// with transparent edges.
export async function toIco(buffer: Buffer): Promise<Buffer> {
  const image = await Jimp.fromBuffer(buffer);
  const largest = Math.min(
    256,
    Math.max(image.bitmap.width, image.bitmap.height),
  );
  const sizes = [largest, ...icoSizes.filter((size) => size < largest)];
  const pngs: Buffer[] = await Promise.all(
    sizes.map((size) =>
      image.clone().contain({ w: size, h: size }).getBuffer("image/png"),
    ),
  );
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2); // an icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size % 256, entry); // (0 is 256)
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4); // color planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(pngs[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([header, ...pngs]);
}
