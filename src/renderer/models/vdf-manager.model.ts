export interface VDFListData {
    [steamDirectory: string]: {
        [userId: string]: {
            shortcuts: {
                path: string,
                data: any
            },
            screenshots: {
                path: string,
                data: any
            }
        }
    }
}

export type VDFListFileData = string;

export interface SteamShortcutsData {
    [steamDirectory: string]: {
        [userID: string]: {
            [appId: string]: any
        }
    }
}