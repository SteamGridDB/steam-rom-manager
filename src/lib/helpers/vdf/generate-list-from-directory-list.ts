import { VDF_ListData } from "../../../models";
import { VDF_AddedItemsFile } from "../../vdf-added-items-file";
import { VDF_ScreenshotsFile } from "../../vdf-screenshots-file";
import { VDF_ShortcutsFile } from "../../vdf-shortcuts-file";
import { APP } from "../../../variables";
import * as paths from "../../../paths";
import { glob } from 'glob';
import * as path from 'path';

export function generateListFromDirectoryList(steamDirectories: string[]) {
  let retrieveMultipleVDFPaths = function (steamDirectories: string[]) {
    let promises: Promise<{ data: { directory: string, users: { id: string, paths: {[k: string]: string} }[] }, error: string }>[] = [];
    for (let i = 0; i < steamDirectories.length; i++) {
      promises.push(new Promise<{ data: { directory: string, users: { id: string, paths: {[k: string]: string} }[] }, error: string }>((resolve, reject) => {
        glob('userdata/+([0-9])/', { dot: true, cwd: steamDirectories[i] }).then((folders: string[]) => {
          if (folders.length === 0) {
            resolve({ data: null, error: APP.lang.helpers.error.noUserIdsInDir__i.interpolate({ steamDirectory: steamDirectories[i] }) });
          }
          else {
            let users: { id: string, paths: {[k: string]: string} }[] = [];
            for (let j = 0; j < folders.length; j++) {
                users.push({
                id: folders[j].split(path.sep).slice(-1)[0],
                paths: {
                  addedItems: path.join(steamDirectories[i], folders[j], 'config', paths.savedListFilename),
                  screenshots: path.join(steamDirectories[i], folders[j], '760', 'screenshots.vdf'),
                  grid: path.join(steamDirectories[i], folders[j], 'config', 'grid'),
                  shortcuts: path.join(steamDirectories[i], folders[j], 'config', 'shortcuts.vdf')
                }
              });
            }
            resolve({ data: { directory: steamDirectories[i], users }, error: null });
          }
        }).catch((err: string)=> {
          reject(err);
        });
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
