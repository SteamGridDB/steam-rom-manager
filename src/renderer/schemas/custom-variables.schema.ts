export const customVariables = {
  type: "object",
  patternProperties: {
    "^.+$": {
      type: "object",
      patternProperties: {
        "^.+$": {
          type: "string",
        },
      },
    },
  },
};
