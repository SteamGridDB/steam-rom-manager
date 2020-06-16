export const userExceptions = {
  type: 'object',
  patternProperties: {
    "^.+$": {
      type: 'object',
      properties: {
        newTitle: { type: 'string', pattern: "^.+$" },
        commandLineArguments: { type: 'string', pattern: "^.+$" },
        exclude: { type: 'boolean' }
      }
    }
  }
}
