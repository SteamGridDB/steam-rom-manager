import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as probe from "probe-image-size";
import { imageDimensions } from "../../src/lib/helpers/url/encode-file";
import { encodeFile } from "../../src/lib/helpers/url/file-url";
import { tempDir } from "../helpers/fixtures";

describe("imageDimensions", () => {
  it("reads sizes from the start of the file: same as reading all of it", () => {
    const dir = path.join(__dirname, "../../src/assets/images");
    const images = fs
      .readdirSync(dir)
      .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const file = path.join(dir, image);
      const full = probe.sync(fs.readFileSync(file));
      expect(imageDimensions(encodeFile(file)), image).toBe(
        `${full.width}x${full.height}`,
      );
    }
  });

  it("a JPEG whose size comes after a big block: falls back to the whole file", () => {
    // SOI, a 70 KB comment segment (COM, in 64 KB-max pieces), then SOF0
    const segment = (marker: number, body: Buffer) =>
      Buffer.concat([
        Buffer.from([
          0xff,
          marker,
          (body.length + 2) >> 8,
          (body.length + 2) & 255,
        ]),
        body,
      ]);
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8]),
      segment(0xfe, Buffer.alloc(60000)),
      segment(0xfe, Buffer.alloc(10000)),
      // SOF0: precision, height 480, width 640, 3 components
      segment(
        0xc0,
        Buffer.from([
          8, 1, 0xe0, 2, 0x80, 3, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1,
        ]),
      ),
      Buffer.from([0xff, 0xd9]),
    ]);
    const file = path.join(tempDir("dims"), "late.jpg");
    fs.writeFileSync(file, jpeg);
    expect(imageDimensions(encodeFile(file))).toBe("640x480");
  });
});
