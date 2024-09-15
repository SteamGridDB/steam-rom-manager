export const userExceptions = {
  type: "object",
  properties: {
    exceptionsVersion: { type: "number" },
    titles: {
      patternProperties: {
        "^.+$": {
          type: "object",
          properties: {
            newTitle: { type: "string", default: "" },
            searchTitle: { type: "string", default: "" },
            commandLineArguments: { type: "string", default: "" },
            exclude: { type: "boolean", default: false },
            excludeArtwork: { type: "boolean", default: false },
            timeStamp: { type: "number", default: 0 },
          },
        },
      },
    },
  },
};
