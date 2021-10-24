import * as crc from 'crc';

export function generateAppId(exe: string, name: string) {
  const key = exe + name;
  const top = BigInt(crc.crc32(key)) | BigInt(0x80000000);
  const bigint = BigInt(top) << BigInt(32) | BigInt(0x02000000);
  return String(bigint);
}

export function generateShortAppId(exe: string, name: string) {
    const key = exe + name;
    const top = BigInt(crc.crc32(key)) | BigInt(0x80000000);
    const bigint = BigInt(top) << BigInt(32) | BigInt(0x02000000);
    const shift = BigInt(bigint) >> BigInt(32);
    return String(shift);
}

export function shortenAppId(appid: string) {
  return String(BigInt(appid) >> BigInt(32));
}

export function lengthenAppId(appid: string) {
  return String(BigInt(appid) << BigInt (32) | BigInt(0x02000000));
}
