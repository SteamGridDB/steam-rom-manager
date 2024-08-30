import { userAccountData } from "../../../models";
import { steamID_64_ToAccountID } from "./steam-id-64-to-account-id";
import { glob } from "glob";
import * as genericParser from "@node-steam/vdf";
import * as path from "path";
import * as fs from "fs-extra";

export function getAvailableLogins(steamDirectory: string) {
  const usersFile = path.join(steamDirectory, "config", "loginusers.vdf");
  let usersPromise: Promise<userAccountData[]>;
  if (fs.existsSync(usersFile)) {
    usersPromise = new Promise<userAccountData[]>((resolve, reject) => {
      try {
        fs.readFile(
          path.join(steamDirectory, "config", "loginusers.vdf"),
          "utf8",
          (err, data) => {
            if (err && err.code !== "ENOENT") {
              resolve([]);
            } else {
              if (data) {
                let parsedData = genericParser.parse(data) as any;
                let accountData: userAccountData[] = [];
                if (parsedData.users) {
                  for (let steamID64 in parsedData.users) {
                    accountData.push({
                      steamID64: steamID64,
                      accountID: steamID_64_ToAccountID(steamID64),
                      name: parsedData.users[steamID64].AccountName,
                    });
                  }
                }
                resolve(accountData);
              } else {
                resolve([]);
              }
            }
          },
        );
      } catch (error) {
        resolve([]);
      }
    });
  } else {
    usersPromise = Promise.resolve([]);
  }

  return usersPromise.then((userAccounts: userAccountData[]) => {
    return glob("userdata/+([0-9])/", { cwd: steamDirectory }).then(
      (files: string[]) => {
        let extraAccounts: userAccountData[] = [];
        for (let i = 0; i < files.length; i++) {
          const userId = files[i].split(path.sep).slice(-1)[0];
          if (
            !userAccounts
              .map((account) => account.accountID)
              .includes(userId) &&
            userId !== "0"
          ) {
            extraAccounts.push({
              steamID64: "unavailable",
              accountID: userId,
              name: userId,
            });
          }
        }
        return [...userAccounts, ...extraAccounts];
      },
    );
  });
}
