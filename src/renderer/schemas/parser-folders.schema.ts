export const parserFolders = {
    type: "object",
    properties: {
        version: {type: "number", default: 0},
        folderMap: {
            type: "object",
            default: {},
            patternProperties: {
                "^.+$": {
                  type: "object",
                  properties: {
                      folderName: {type: "string", default: ""}
                  }
                }
            }
        },
        folders: {
            type: "array",
            default: [] as string[],
            items: { type: "string" }
        }
    }
  };