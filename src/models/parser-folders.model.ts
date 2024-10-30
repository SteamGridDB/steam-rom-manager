export interface ParserFoldersMap {
    [parserId: string]: {
        folderName: string
    }
}

export interface ParserFolders {
    version: number,
    folderMap: ParserFoldersMap,
    folders: string[]
}