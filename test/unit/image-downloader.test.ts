// Artwork downloads time out only when they stall: many at once share the
// bandwidth, so a large image can take longer in all than the timeout.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { AddressInfo } from "net";
import { ImageDownloader } from "../../src/lib/helpers/url/image-downloader";
import { tempDir } from "../helpers/fixtures";

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
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => {
    server.closeAllConnections();
    server.close();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("a slow download that keeps arriving completes, however long it takes in all", async () => {
    const file = path.join(root, "slow.jpg");
    await new ImageDownloader([], 400).downloadAndSaveImage(`${base}/slow.jpg`, file, 0);
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
});
