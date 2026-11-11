import { describe, expect, it } from "vitest";
import { isIco, toIco } from "../../src/lib/helpers/url/ico";

const { Jimp } = require("jimp");

// The entries of an .ico: [width, height, the PNG's own size].
async function entries(ico: Buffer) {
  const count = ico.readUInt16LE(4);
  const result: number[][] = [];
  for (let i = 0; i < count; i++) {
    const entry = 6 + 16 * i;
    const png = ico.subarray(
      ico.readUInt32LE(entry + 12),
      ico.readUInt32LE(entry + 12) + ico.readUInt32LE(entry + 8),
    );
    const image = await Jimp.fromBuffer(png);
    result.push([
      ico.readUInt8(entry) || 256,
      ico.readUInt8(entry + 1) || 256,
      image.bitmap.width,
    ]);
  }
  return result;
}

describe("toIco", () => {
  it("makes an .ico of the sizes Windows uses, no bigger than 256", async () => {
    const png = await new Jimp({
      width: 512,
      height: 512,
      color: 0xff0000ff,
    }).getBuffer("image/png");
    const ico = await toIco(png);
    expect(isIco(ico)).toBe(true);
    expect(isIco(png)).toBe(false);
    expect(await entries(ico)).toEqual([
      [256, 256, 256],
      [64, 64, 64],
      [48, 48, 48],
      [32, 32, 32],
      [24, 24, 24],
      [16, 16, 16],
    ]);
  });

  it("a small image isn't made bigger; a wide one is made square, its edges transparent", async () => {
    const jpeg = await new Jimp({
      width: 40,
      height: 20,
      color: 0x00ff00ff,
    }).getBuffer("image/jpeg");
    const ico = await toIco(jpeg);
    expect(await entries(ico)).toEqual([
      [40, 40, 40],
      [32, 32, 32],
      [24, 24, 24],
      [16, 16, 16],
    ]);
    const first = await Jimp.fromBuffer(
      ico.subarray(
        ico.readUInt32LE(18),
        ico.readUInt32LE(18) + ico.readUInt32LE(14),
      ),
    );
    expect(first.getPixelColor(20, 0) & 0xff).toBe(0); // top edge: clear
    expect(first.getPixelColor(20, 20) & 0xff).toBe(0xff); // middle: the image
  });
});
