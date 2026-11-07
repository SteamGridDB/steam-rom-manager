// Artwork downloads time out only when they stall: many at once share the
// bandwidth, so a large image can take longer in all than the timeout.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { AddressInfo } from "net";
import { map_ext } from "../../src/lib/helpers/steam/image-extensions";
import { ImageDownloader } from "../../src/lib/helpers/url/image-downloader";
import { encodeFile } from "../../src/lib/helpers/url/file-url";
import { tempDir } from "../helpers/fixtures";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// Signature plus a marker byte and `extra` padding, so two entries differ
// both in contents and in payload size.
function pngBytes(marker: number, extra: number): Buffer {
  return Buffer.concat([
    PNG_SIGNATURE,
    Buffer.from([marker]),
    Buffer.alloc(extra),
  ]);
}

// ICONDIR (reserved 0, type 1, count) plus 16-byte entries. Width/height 256
// is stored as the byte 0.
function ico(
  images: { width: number; height: number; payload: Buffer }[],
): Buffer {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const parts: Buffer[] = [header];
  let offset = header.length;
  images.forEach((image, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(image.width === 256 ? 0 : image.width, entry);
    header.writeUInt8(image.height === 256 ? 0 : image.height, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.payload.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.payload.length;
    parts.push(image.payload);
  });
  return Buffer.concat(parts);
}

describe("ImageDownloader", () => {
  let server: http.Server;
  let base: string;
  let root: string;
  let stalledRequests = 0;

  beforeAll(async () => {
    root = tempDir("downloads");
    server = http.createServer((req, res) => {
      if (req.url === "/slow.jpg") {
        // 6 chunks, 150 ms apart: 750+ ms in all, never 150 ms without data
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        let sent = 0;
        const timer = setInterval(() => {
          res.write(`chunk${sent}.`);
          if (++sent === 6) {
            clearInterval(timer);
            res.end();
          }
        }, 150);
      } else if (req.url === "/stalls.jpg") {
        stalledRequests++;
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.write("start");
        // ...and nothing more
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.closeAllConnections();
    server.close();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("a slow download that keeps arriving completes, however long it takes in all", async () => {
    const file = path.join(root, "slow.jpg");
    await new ImageDownloader([], 400).downloadAndSaveImage(
      `${base}/slow.jpg`,
      file,
      0,
    );
    expect(fs.readFileSync(file, "utf8")).toBe(
      "chunk0.chunk1.chunk2.chunk3.chunk4.chunk5.",
    );
  });

  it("a stalled download is retried, then reported", async () => {
    stalledRequests = 0;
    await expect(
      new ImageDownloader([], 200).downloadAndSaveImage(
        `${base}/stalls.jpg`,
        path.join(root, "stalls.jpg"),
        1,
      ),
    ).rejects.toMatch(/stalled \(nothing received for 200 milliseconds\)/);
    expect(stalledRequests).toBe(2);
    expect(fs.existsSync(path.join(root, "stalls.jpg"))).toBe(false);
  });

  it("an HTTP error isn't saved as artwork", async () => {
    await expect(
      new ImageDownloader([], 200).downloadAndSaveImage(
        `${base}/missing.jpg`,
        path.join(root, "missing.jpg"),
        0,
      ),
    ).rejects.toMatch(/HTTP 404/);
  });

  // Before the fix a .png destination still started with the ICO header
  // 00 00 01 00. Steam on Linux never displayed that file.
  async function saveDownload(bytes: Buffer, destName: string) {
    const src = path.join(root, `in-${destName}`);
    const dest = path.join(root, destName);
    fs.writeFileSync(src, bytes);
    await new ImageDownloader([]).downloadAndSaveImage(encodeFile(src), dest);
    return fs.readFileSync(dest);
  }

  it("an ICO saved as .png keeps the largest embedded PNG", async () => {
    // 16 is the longer payload, so a size ranking would pick it and fail.
    const png16 = pngBytes(0x10, 24);
    const png32 = pngBytes(0x20, 0);
    const byArea = ico([
      { width: 32, height: 32, payload: png32 },
      { width: 16, height: 16, payload: png16 },
    ]);
    expect(await saveDownload(byArea, "area.png")).toEqual(png32);

    // Width byte 0 means 256 and must beat the 32 entry even though that
    // entry's payload is larger.
    const png256 = pngBytes(0x00, 0);
    const png32Long = pngBytes(0x21, 16);
    const widthByteZero = ico([
      { width: 32, height: 32, payload: png32Long },
      { width: 256, height: 256, payload: png256 },
    ]);
    expect(await saveDownload(widthByteZero, "byte0.png")).toEqual(png256);
  });

  it("an ICO saved as .ico stays the ICO container", async () => {
    const png16 = pngBytes(0x10, 24);
    const png32 = pngBytes(0x20, 0);
    const icon = ico([
      { width: 32, height: 32, payload: png32 },
      { width: 16, height: 16, payload: png16 },
    ]);
    expect(await saveDownload(icon, "keep.ico")).toEqual(icon);
  });

  it("a PNG saved as .png is unchanged", async () => {
    const plain = pngBytes(0x01, 4);
    expect(await saveDownload(plain, "plain.png")).toEqual(plain);
  });

  it("an uppercase ICO extension maps to png on Linux only", () => {
    const saved = process.platform === "linux" ? "png" : "ico";
    expect(map_ext["ICO"]).toBe(saved);
    expect(map_ext["ico"]).toBe(saved);
  });

  it("a truncated ICO or one without a PNG is still saved", async () => {
    const truncated = Buffer.from([
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x20, 0x20,
    ]);
    // BITMAPINFOHEADER, not a PNG signature.
    const dib = ico([
      {
        width: 32,
        height: 32,
        payload: Buffer.from([0x28, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00]),
      },
    ]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await expect(saveDownload(truncated, "trunc.png")).resolves.toEqual(
        truncated,
      );
      await expect(saveDownload(dib, "dib.png")).resolves.toEqual(dib);
      expect(warn).toHaveBeenCalledTimes(2);
      for (const call of warn.mock.calls) {
        expect(String(call[0])).toContain("ICO extract failed for image");
      }
    } finally {
      warn.mockRestore();
    }
  });
});
