import * as os from 'os';
import * as fs from 'fs-extra'
import * as path from 'path';
import * as probe from 'probe-image-size';
import * as uri2path from 'file-uri-to-path';
import fetch, { AbortError } from 'node-fetch';

const timeout = 10000;

export async function downloadAndSaveImage(imageUrl: string, filePath: string) {
  if(imageUrl.startsWith('file://')) {
    return await fs.copyFile(decodeFile(imageUrl), filePath);
  } else {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(imageUrl, { signal: controller.signal });
      const arrayBuff = await res.arrayBuffer();
      fs.outputFileSync(filePath, Buffer.from(arrayBuff))
    } catch(error) {
      if(error instanceof AbortError) {
        throw `Request timed out after ${timeout} milliseconds.`
      } else {
        throw error;
      }
    }
  }
}

export function decodeFile(file_uri: string) {
  if(os.type()=="Windows_NT") {
    return uri2path(file_uri);
  }
  return decodeURIComponent(file_uri).split(":")[1];
}

export function imageDimensions(file_uri: string) {
  return ((result: any)=> `${result.width||0}x${result.height||0}`)(probe.sync(fs.readFileSync(decodeFile(file_uri)))||{});
}

export function encodeFile(file_path: string) {
  return encodeURI(`file:///${file_path.replace(/\\/g, '/')}`).replace(/#/g, '%23');
  }


