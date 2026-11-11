import * as fs from "fs-extra";
import fetch, { AbortError } from "node-fetch";
import { Resolver } from "dns";

const { Jimp } = require("jimp");

// To Do - get webpack working via
// Currently having trouble importing @jimp/wasm-webp
// import { createJimp } from "@jimp/core";
// import { defaultFormats, defaultPlugins } from "jimp";
// import webp from "@jimp/wasm-webp";

// const Jimp = createJimp({
//   formats: [...defaultFormats, webp],
//   plugins: defaultPlugins,
// });

import { decodeFile } from "./encode-file";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

// Reserved uint16 0, type uint16 1 (ICO, not CUR).
function isIcoContainer(buffer: Buffer): boolean {
  return (
    buffer.length >= 6 &&
    buffer.readUInt16LE(0) === 0 &&
    buffer.readUInt16LE(2) === 1
  );
}

// Largest PNG embedded in an ICO. Width and height bytes of 0 mean 256.
// Area (width * height) wins, and a tie goes to the larger payload.
// Returns null when the buffer is not an ICO, the container is short or
// inconsistent, or no entry is a PNG. Callers keep the original bytes.
// Does not throw.
export function extractLargestIcoPng(buffer: Buffer): Buffer | null {
  if (!isIcoContainer(buffer)) {
    return null;
  }
  const count = buffer.readUInt16LE(4);
  const directoryEnd = 6 + count * 16;
  if (directoryEnd > buffer.length) {
    return null;
  }

  let best: Buffer | null = null;
  let bestArea = -1;
  let bestSize = -1;
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16;
    const widthByte = buffer.readUInt8(entry);
    const heightByte = buffer.readUInt8(entry + 1);
    const width = widthByte === 0 ? 256 : widthByte;
    const height = heightByte === 0 ? 256 : heightByte;
    const size = buffer.readUInt32LE(entry + 8);
    const offset = buffer.readUInt32LE(entry + 12);
    // Every image range has to sit inside the file. One bad entry makes the
    // container inconsistent: don't keep a PNG from a corrupt directory.
    if (offset > buffer.length || size > buffer.length - offset) {
      return null;
    }
    const payload = buffer.subarray(offset, offset + size);
    if (
      payload.length < PNG_SIGNATURE.length ||
      !payload.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
    ) {
      continue;
    }
    const area = width * height;
    if (area > bestArea || (area === bestArea && size > bestSize)) {
      best = Buffer.from(payload);
      bestArea = area;
      bestSize = size;
    }
  }
  return best;
}

export class ImageDownloader {
  private dnsResolver;
  private dnsCache: { [host: string]: string };

  // `timeout`: how long a download may go without receiving anything (a
  // slow download still arriving isn't cut off: many at once share the
  // bandwidth, and large artwork can take longer than this in all).
  constructor(
    dnsServers: string[],
    private timeout: number = 10000,
  ) {
    if (dnsServers && dnsServers.length) {
      this.dnsResolver = new Resolver();
      this.dnsResolver.setServers(dnsServers);
      this.dnsCache = {};
    }
  }

  async downloadAndSaveImage(
    imageUrl: string,
    filePath: string,
    retryCount?: number,
    secondaryPath?: string,
    externalDNS?: string[],
    overlayPath?: string,
  ): Promise<void> {
    const writeBuffer = async (buffer: Buffer) => {
      // Linux grid names end in .png (map_ext) while the download is still an
      // ICO. Swap in the largest embedded PNG before the overlay reads it.
      if (filePath.endsWith(".png") && isIcoContainer(buffer)) {
        const png = extractLargestIcoPng(buffer);
        if (png) {
          buffer = png;
        } else {
          console.warn(
            `ICO extract failed for image ${imageUrl}:\n no embedded PNG`,
          );
        }
      }
      // until we can figure out how to include custom jimp plugins
      // animated images can't be overlaid
      if (overlayPath) {
        try {
          const overlayFilePath = overlayPath.startsWith("file://")
            ? decodeFile(overlayPath)
            : overlayPath;
          const overlayBuffer = await fs.readFile(overlayFilePath);
          const baseImage = await Jimp.fromBuffer(buffer);
          const overlayImage = await Jimp.fromBuffer(overlayBuffer);

          overlayImage.cover({
            w: baseImage.bitmap.width,
            h: baseImage.bitmap.height,
          });

          // "northeast" gravity = anchor to top-right
          const x = baseImage.bitmap.width - overlayImage.bitmap.width;
          const y = 0;
          baseImage.composite(overlayImage, x, y);
          buffer = await baseImage.getBuffer("image/png");
        } catch (e) {
          console.warn(`Overlay failed for image ${imageUrl}:\n ${e}`);
        }
      }
      await fs.outputFile(filePath, buffer);
      if (secondaryPath) {
        await fs.outputFile(secondaryPath, buffer);
      }
    };

    if (imageUrl.startsWith("file://")) {
      const localPath = decodeFile(imageUrl);
      const buffer = await fs.readFile(localPath);
      return writeBuffer(buffer);
    } else {
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout>;
      // (restarted whenever data arrives: only a stalled download times out)
      const stillWaiting = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), this.timeout);
      };
      stillWaiting();
      try {
        let res;
        if (this.dnsResolver) {
          const { resolved, host } = await this.resolveDNS(imageUrl);
          res = await fetch(resolved, {
            signal: controller.signal,
            method: "GET",
            headers: {
              Host: host,
            },
          });
        } else {
          res = await fetch(imageUrl, {
            signal: controller.signal,
            method: "GET",
          });
        }

        // (an error page is not artwork)
        if (!res.ok) {
          throw `HTTP ${res.status} ${res.statusText}: ${imageUrl}`;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of res.body) {
          stillWaiting();
          chunks.push(Buffer.from(chunk as Buffer));
        }
        clearTimeout(timeoutId);
        return writeBuffer(Buffer.concat(chunks));
      } catch (error) {
        if (error instanceof AbortError) {
          if (retryCount && retryCount > 0) {
            return this.downloadAndSaveImage(
              imageUrl,
              filePath,
              retryCount - 1,
              secondaryPath,
              externalDNS,
              overlayPath,
            );
          } else {
            throw `Download stalled (nothing received for ${this.timeout} milliseconds). URL: ${imageUrl}`;
          }
        } else {
          throw error;
        }
      } finally {
        // (or the timer keeps a command line run alive for its full length)
        clearTimeout(timeoutId);
      }
    }
  }

  resolveDNS(imageUrl: string) {
    return new Promise<{ resolved: string; host: string }>(
      (resolve, reject) => {
        const { host, pathname, protocol } = new URL(imageUrl);
        if (this.dnsCache[host]) {
          resolve({
            resolved: `${protocol}//${this.dnsCache[host]}${pathname}`,
            host: host,
          });
        } else {
          this.dnsResolver.resolve(host, (err, addresses) => {
            if (err || !addresses.length) {
              reject(err);
            } else {
              this.dnsCache[host] = addresses[0];
              resolve({
                resolved: `${protocol}//${addresses[0]}${pathname}`,
                host: host,
              });
            }
          });
        }
      },
    );
  }
}
