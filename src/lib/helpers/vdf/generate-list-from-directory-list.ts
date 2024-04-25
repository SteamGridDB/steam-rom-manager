import { userAccountData, VDF_ListData } from "../../../models";
import { VDF_AddedItemsFile } from "../../vdf-added-items-file";
import { VDF_ScreenshotsFile } from "../../vdf-screenshots-file";
import { VDF_ShortcutsFile } from "../../vdf-shortcuts-file";
import { APP } from "../../../variables";
import * as paths from "../../../paths";
import * as path from 'path';
import { getAvailableLogins } from "../steam";

export function generateListFromDirectoryList(steamDirectories: string[]) {
  let retrieveMultipleVDFPaths = function (steamDirectories: string[]) {
    let promises: Promise<{ data: { directory: string, users: { id: string, paths: {[k: string]: string} }[] }, error: string }>[] = [];
    for (let steamDirectory of steamDirectories) {
      promises.push(new Promise<{ data: { directory: string, users: { id: string, paths: {[k: string]: string} }[] }, error: string }>((resolve, reject) => {
        getAvailableLogins(steamDirectory).then((userAccounts: userAccountData[]) => {
          if (userAccounts.length === 0) {
            resolve({ data: null, error: APP.lang.helpers.error.noUserIdsInDir__i.interpolate({ steamDirectory: steamDirectory }) });
          }           
          else {
            let users: { id: string, paths: {[k: string]: string} }[] = [];
            for (let userAccount of userAccounts) {
              const accountDir = path.join(steamDirectory,'userdata',userAccount.accountID)
              users.push({
                id: userAccount.accountID,
                paths: {
                  addedItems: path.join(accountDir, 'config', paths.savedListFilename),
                  screenshots: path.join(accountDir, '760', 'screenshots.vdf'),
                  grid: path.join(accountDir, 'config', 'grid'),
                  shortcuts: path.join(accountDir, 'config', 'shortcuts.vdf')
                }
              });
            }
            resolve({ data: { directory: steamDirectory, users }, error: null });
          }
        }).catch((err: string) => {
          reject(err)
        })
      }));
    }
    return Promise.all(promises);
  }

  return retrieveMultipleVDFPaths(steamDirectories).then((data) => {
    let vdfData: VDF_ListData = {};
    let numberOfGeneratedEntries: number = 0;
    let errors: string[] = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].error)
        errors.push(data[i].error);
      else {
        let directory = data[i].data.directory;
        let users = data[i].data.users;

        if (vdfData[directory] === undefined)
          vdfData[directory] = {};

        for (let j = 0; j < users.length; j++) {
          let user = users[j];

          if (vdfData[directory][user.id] === undefined) {
            numberOfGeneratedEntries++;
            vdfData[directory][user.id] = {
              addedItems: new VDF_AddedItemsFile(user.paths.addedItems),
              screenshots: new VDF_ScreenshotsFile(
                path.join(user.paths.screenshots),
                path.join(user.paths.grid)
              ),
              shortcuts: new VDF_ShortcutsFile(user.paths.shortcuts)
            };
          }
        }
      }
    }

    return { data: vdfData, numberOfGeneratedEntries, errors };
  });
}
