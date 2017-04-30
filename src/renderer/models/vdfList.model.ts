export interface VDFListData {
    [steamDirectory: string]: {
        [userId: string]: {
            shortcuts: {
                filename: string,
                data: any
            },
            screenshots: {
                filename: string,
                data: any
            }
        }
    }
}

export interface VDFListHubFileData { 
    entry: string, 
    image: string 
}