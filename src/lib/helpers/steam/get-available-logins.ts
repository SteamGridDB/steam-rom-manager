import { userAccountData } from "../../../models";
import { steamID_64_ToAccountID } from "./steam-id-64-to-account-id";
import { glob } from 'glob';
import * as genericParser from '@node-steam/vdf';
import * as path from 'path';
import * as fs from 'fs-extra';

export function getAvailableLogins(steamDirectory: string) {
  return new Promise<userAccountData[]>((resolve, reject) => {
    fs.readFile(path.join(steamDirectory, 'config', 'loginusers.vdf'), 'utf8', (err, data) => {
      try {
        if (err && err.code !== 'ENOENT')
          reject(err);
        else {
          if (data) {
            let parsedData = genericParser.parse(data) as any;
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
