import { SteamTree } from "../../../models";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as _ from "lodash";

export function getGridImagesForTree(tree: SteamTree<{ [appId: string]: string }>) {
  return Promise.resolve().then(() => {
    let data = _.cloneDeep(tree);

    if (data.numberOfUsers === 0)
      return data;
    else {
      let promises: Promise<void>[] = [];
      for (let steamDirectory in data.tree) {
        for (let userId in data.tree[steamDirectory]) {
          promises.push(
            fs.readdir(path.join(steamDirectory, 'userdata', userId, 'config', 'grid')).then((files) => {
              let extRegex = /png|ico|tga|jpg|jpeg/i;
              for (let i = 0; i < files.length; i++) {
                let ext = path.extname(files[i]);
                let appId = path.basename(files[i], ext);
                if (data.tree[steamDirectory][userId][appId] === undefined) {
                  if (extRegex.test(ext))
                    data.tree[steamDirectory][userId][appId] = path.join(steamDirectory, 'userdata', userId, 'config', 'grid', files[i]);
                }
              }
            }).catch((error) => {
              if (error.code !== 'ENOENT')
                throw error;
            })
          );
        }
      }
      return Promise.all(promises).then(() => {
        return data
      });
    }
  });
}
