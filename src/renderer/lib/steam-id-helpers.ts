import { userAccountData } from '../models';
import * as crc from 'crc';
import * as long from 'long';
import * as path from 'path';
import * as fs from 'fs-extra';

export function getAvailableLogins(steamDirectory: string) {
    return new Promise<userAccountData[]>((resolve, reject) => {
        let vdfParser = require('vdf');
        fs.readFile(path.join(steamDirectory, 'config', 'loginusers.vdf'), 'utf8', (err, data) => {
            try {
                if (err && err.code !== 'ENOENT')
                    reject(err);
                else {
                    if (data) {
                        let parsedData = vdfParser.parse(data);
                        let accountData: userAccountData[] = [];
                        if (parsedData.users) {
                            for (let steamID64 in parsedData.users) {
                                accountData.push({ steamID64: steamID64, accountID: steamID_64_ToAccountID(steamID64), name: parsedData.users[steamID64].AccountName });
                            }
                        }
                        resolve(accountData);
                    }
                    else
                        resolve([]);
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

export function steamID_64_ToAccountID(steamID64: string) {
    let steamID_64_Identifier = long.fromString("0110000100000000", true, 16);
    let longValue = long.fromValue(steamID64).subtract(steamID_64_Identifier);
    return longValue.toString();
}

export function generateAppId(executableLocation: string, title: string) {
    //From https://github.com/Hafas/node-steam-shortcuts

    let crcValue = crc.crc32(executableLocation + title);
    let longValue = new long(crcValue, crcValue, true);
    longValue = longValue.or(0x80000000);
    longValue = longValue.shl(32);
    longValue = longValue.or(0x02000000);
    return longValue.toString();
}