// userExceptions.json, version 3 (see models/user-exceptions.model.ts).
// Which game a rule matches (matchAppId or matchTitle, exactly one) is
// checked by ExceptionsStore, not here.
const match = {
  matchTitle: { type: "string" },
  matchAppId: { type: "string" },
  appTitle: { type: "string" },
};

const legacyEntry = {
  type: "object",
  properties: {
    newTitle: { type: "string", default: "" },
    searchTitle: { type: "string", default: "" },
    commandLineArguments: { type: "string", default: "" },
    exclude: { type: "boolean", default: false },
    excludeArtwork: { type: "boolean", default: false },
    timeStamp: { type: "number", default: 0 },
    compatToolName: { type: "string" },
  },
};

export const userExceptions = {
  type: "object",
  properties: {
    exceptionsVersion: { type: "number" },
    exceptions: {
      type: "array",
      default: [] as any[],
      items: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          ...match,
          timeStamp: { type: "number", default: 0 },
          newTitle: { type: "string", default: "" },
          searchTitle: { type: "string", default: "" },
          sgdbId: { type: "string", default: "" },
          commandLineArguments: { type: "string", default: "" },
          excludeArtwork: { type: "boolean", default: false },
          compatToolName: { type: "string" },
        },
      },
    },
    exclusions: {
      type: "array",
      default: [] as any[],
      items: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          ...match,
          timeStamp: { type: "number", default: 0 },
        },
      },
    },
    // Older SRM versions' format, kept in step for them (never read).
    titles: {
      type: "object",
      patternProperties: { "^.+$": legacyEntry },
    },
  },
};
