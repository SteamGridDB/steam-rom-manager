export interface ValidatorModifier<T> {
    latestVersion: string | number,
    controlProperty: string,
    fields: {
        [controlValue: string]: {
            [fields: string]: {
                method?: (oldValue: any, self: T) => any,
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