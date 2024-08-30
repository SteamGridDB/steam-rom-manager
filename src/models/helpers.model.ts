export interface ValidatorModifier<T> {
  latestVersion: string | number;
  controlProperty: string;
  fields: {
    [controlValue: string]: {
      [fields: string]: {
        keyMatch?: RegExp; // keyMatchs are expected to be disjoint!
        method?: (oldValue: any, self: any) => any;
        oldValuePath?: string;
      };
    };
  };
}

export interface userAccountData {
  name: string;
  steamID64: string;
  accountID: string;
}

export interface SteamDirList<T> {
  [steamDir: string]: T;
}

export type SteamList<T> = SteamDirList<{
  [userId: string]: T;
}>;

export interface SteamTree<T> {
  tree: SteamList<T>;
  numberOfUsers: number;
}

export const StringLiteralArray = <L extends string>(arr: L[]) => arr;

export interface StringDict {
  [key: string]: string;
}
