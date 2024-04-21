import { SteamTree, VDF_ShortcutsItem, PreviewData } from "../../../models";
import { VDF_Manager } from "../../vdf-manager";
import * as _ from "lodash";

export function getNonSteamShortcutsData(tree: SteamTree<{ [appId: string]: VDF_ShortcutsItem }>) {
    return Promise.resolve().then(() => {
        let data = _.cloneDeep(tree);

        if (data.numberOfUsers === 0)
            return data;
        else {
            let vdfManager = new VDF_Manager();
            return Promise.resolve().then(() => {
                return vdfManager.prepare(data.tree as any as PreviewData);
            }).then(() => {
                return vdfManager.read({ shortcuts: { read: true, skipIndexing: true }, addedItems: false, screenshots: false });
            }).then(() => {
                vdfManager.forEach((steamDirectory, userId, listItem) => {
                    if (data.tree[steamDirectory] !== undefined && data.tree[steamDirectory][userId] !== undefined) {
                        let appIds = listItem.shortcuts.getAppIds();

                        data.tree[steamDirectory][userId] = {};
                        for (let i = 0; i < appIds.length; i++) {
                            data.tree[steamDirectory][userId][appIds[i]] = listItem.shortcuts.getItem(appIds[i]);
                        }
                    }
                });
                return data;
            })
        }
    });
}