import { userAccountData } from "../../../models";
import { steamID_64_ToAccountID } from "./steam-id-64-to-account-id";
import { glob } from 'glob';
import * as genericParser from '@node-steam/vdf';
import * as path from 'path';
import * as fs from 'fs-extra';

export function getAvailableLogins(steamDirectory: string) {
  return new Promise<userAccountData[]>((resolve, reject) => {
    const usersFile = path.join(steamDirectory, 'config', 'loginusers.vdf');
    if(fs.existsSync(usersFile)) {
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
    } else {
      glob('userdata/+([0-9])/', { cwd: steamDirectory })
      .then((files: string[]) => {
          let accountData: userAccountData[] = [];
          for (let i = 0; i < files.length; i++) {
            const userId = files[i].split(path.sep).slice(-1)[0];
            console.log("userId", userId)
            accountData.push({ steamID64: 'unavailable', accountID: userId, name: userId });
          }
          resolve(accountData);
      }).catch((err: string)=>{
        reject(err)
      });
    }
  });
}
