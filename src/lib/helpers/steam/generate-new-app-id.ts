import * as crc from 'crc';
import * as long from 'long';

export function generateNewAppId(executableLocation: string, title: string) {
  let crcValue = crc.crc32(executableLocation + title);
  let longValue = new long(crcValue).or(0x80000000);
  let shift = new long(longValue.toNumber(), longValue.toNumber(), true).shl(32).or(0x02000000).shru(32);
  return shift.toString();
}