import * as crc from 'crc';
import * as long from 'long';
import * as path from 'path';
import * as fs from 'fs-extra';

/*export function getAvailableLogins(steamDirectory: string) {
    return new Promise<{username: string, steamID64: string}[]>((resolve, reject) => {
        let vdfParser = require('vdf');
        fs.readFile(path.join(steamDirectory, 'config', 'loginusers.vdf'), 'utf8', (err, data) => {
            try {
                if (err && err.code !== 'ENOENT')
                    reject(err);
                else {
                    if (data){
                        let parsedData = vdfParser.parse(data);
                        console.log(parsedData);
                        resolve([]);
                    }
                    else
                        resolve([]);
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}*/

export function generateAppId(quotedExecutableLocation: string, title: string) {
    //From https://github.com/Hafas/node-steam-shortcuts

    let crcValue = crc.crc32(quotedExecutableLocation + title);
    let longValue = new long(crcValue, crcValue, true);
    longValue = longValue.or(0x80000000);
    longValue = longValue.shl(32);
    longValue = longValue.or(0x02000000);
    return longValue.toString();
}