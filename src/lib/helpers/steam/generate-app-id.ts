import * as crc from 'crc';
import * as BigInt from 'big-integer';

export function generateAppId(exe: string, name: string) {
  const key = exe + name;
  const top = BigInt(crc.crc32(key)).or(BigInt(0x80000000));
  const bigint = BigInt(top).shiftLeft(32).or(BigInt(0x02000000));
  return String(bigint);
}

export function generateShortAppId(exe: string, name: string) {
    const key = exe + name;
    const top = BigInt(crc.crc32(key)).or(BigInt(0x80000000));
    const bigint = BigInt(top).shiftLeft(32).or(BigInt(0x02000000));
    const shift = BigInt(bigint).shiftRight(32);
    return String(shift);
}

export function shortenAppId(appid: string) {
  return String(BigInt(appid).shiftRight(32));
}

export function lengthenAppId(appid: string) {
  return String(BigInt(appid).shiftLeft(32).or(BigInt(0x02000000)));
}
