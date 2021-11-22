export interface ValidatorModifier<T> {
  latestVersion: string | number,
  controlProperty: string,
  fields: {
    [controlValue: string]: {
      [fields: string]: {
        keyMatch?: RegExp // keyMatchs are expected to be disjoint!
        method?: (oldValue: any, self: any) => any,
        oldValuePath?: string
      }
    }
  }
}

export interface userAccountData{
  name: string,
  steamID64: string,
  accountID: string
}

export interface SteamTree<T> {
  tree: {
    [steamDirectory: string]: {
      [userId: string]: T
    }
  },
  numberOfUsers: number
}


export const StringLiteralArray = <L extends string>(arr: L[])=>arr;
