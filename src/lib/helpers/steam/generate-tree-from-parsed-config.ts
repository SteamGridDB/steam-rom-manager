import { ParsedUserConfiguration, SteamTree } from "../../../models";

export function generateTreeFromParsedConfig(data: ParsedUserConfiguration[]) {
  let steamTree: SteamTree<any> = {
    tree: {},
    numberOfUsers: 0,
  };

  for (let i = 0; i < data.length; i++) {
    let config = data[i];

    if (steamTree.tree[config.steamDirectory] === undefined)
      steamTree.tree[config.steamDirectory] = {};

    for (let j = 0; j < config.foundUserAccounts.length; j++) {
      let userAccount = config.foundUserAccounts[j];

      if (
        steamTree.tree[config.steamDirectory][userAccount.accountID] ===
        undefined
      ) {
        steamTree.numberOfUsers++;
        steamTree.tree[config.steamDirectory][userAccount.accountID] = {};
      }
    }
  }

  return steamTree;
}
