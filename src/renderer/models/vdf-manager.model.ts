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

export interface VDFListFileData { 
    title: string, 
    imageBasename: string 
}