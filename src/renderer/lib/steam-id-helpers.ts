import { userAccountData } from '../models';
import * as crc from 'crc';
import * as long from 'long';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';

export function getAvailableLogins(steamDirectory: string, useCredentials: boolean) {
    return new Promise<userAccountData[]>((resolve, reject) => {
        if (useCredentials) {
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
        }
        else {
            glob('userdata/+([0-9])/', { silent: true, cwd: steamDirectory }, (err, files) => {
                if (err)
                    reject(err);
                else {
                    let getUserId = function (filename: string) {
                        return /userdata(\\|\/)(.*?)(\\|\/)/i.exec(filename)[2];
                    }
                    
                    let accountData: userAccountData[] = [];
                    for (let i = 0; i < files.length; i++) {
                        let userId = getUserId(files[i]);
                        accountData.push({ steamID64: 'unavailable', accountID: userId, name: userId });
                    }
                    resolve(accountData);
                }
            });
        }
    });
}

export function getMultipleAvailableLogins(steamDirectories: string[], useCredentials: boolean | boolean[]) {
    let multipleDirData: { data: { [directory: string]: userAccountData[] }, numberOfAccounts: number } = { data: {}, numberOfAccounts: 0 };
    let promises: Promise<userAccountData[]>[] = [];
    let isArray = useCredentials instanceof Array;

    for (let i = 0; i < steamDirectories.length; i++) {
        promises.push(getAvailableLogins(steamDirectories[i], isArray ? (useCredentials[i] || false) : useCredentials || false));
    }

    return Promise.resolve().then(() => {
        if (promises.length > 0) {
            return promises.reduce((p, c, i) => p.then((data) => {
                multipleDirData.data[steamDirectories[i]] = data;
                multipleDirData.numberOfAccounts += data.length;
                return c;
            }), Promise.resolve().then(() => promises[0]));
        }
    }).then(() => {
        return multipleDirData;
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