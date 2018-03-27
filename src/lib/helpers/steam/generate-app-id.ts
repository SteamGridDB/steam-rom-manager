import * as crc from 'crc';
import * as long from 'long';

export function generateAppId(executableLocation: string, title: string) {
    //From https://github.com/Hafas/node-steam-shortcuts

    let crcValue = crc.crc32(executableLocation + title);
    let longValue = new long(crcValue, crcValue, true);
    longValue = longValue.or(0x80000000);
    longValue = longValue.shl(32);
    longValue = longValue.or(0x02000000);
    return longValue.toString();
}