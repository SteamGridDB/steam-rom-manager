import * as fs from "fs-extra";
import fetch, { AbortError } from "node-fetch";
import { Resolver } from "dns";
import sharp from "sharp";
import { decodeFile } from "./encode-file";

export class ImageDownloader {
  private dnsResolver;
  private timeout: number = 10000;
  private dnsCache: { [host: string]: string };

  constructor(dnsServers: string[]) {
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
      if (overlayPath) {
        const overlayFilePath = overlayPath.startsWith("file://")
          ? decodeFile(overlayPath)
          : overlayPath;
        const overlayBuffer = await fs.readFile(overlayFilePath);
        const bufferMetadata = await sharp(buffer).metadata();
        const overlayBufferResized = await sharp(overlayBuffer)
          .resize(bufferMetadata.width, bufferMetadata.height, {
            fit: "cover", position: "left top",
          })
          .toBuffer();
        buffer = await sharp(buffer)
          .composite([{ input: overlayBufferResized, blend: "over", gravity: "northeast" }])
          .toBuffer();
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
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
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

        const arrayBuff = Buffer.from(await res.arrayBuffer());
        return writeBuffer(arrayBuff);
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
            throw `Request timed out after ${this.timeout} milliseconds. URL: ${imageUrl}`;
          }
        } else {
          throw error;
        }
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
