export const customVariables = {
  type: "object",
  patternProperties: {
    "^.+$": {
      type: "object",
      patternProperties: {
        "^.+$": {
          oneOf: [
            { type: "string" },
            {
              type: "object",
              properties: {
                DisplayTitle: { type: "string" },
                SortAsTitle: { type: "string" },
              },
              required: ["DisplayTitle", "SortAsTitle"],
              additionalProperties: false,
            },
          ],
        },
      },
    },
  },
};