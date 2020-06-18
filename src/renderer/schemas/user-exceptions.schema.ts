export const userExceptions = {
  type: 'object',
  patternProperties: {
    "^.+$": {
      type: 'object',
      properties: {
        newTitle: { type: 'string' },
        commandLineArguments: { type: 'string'},
        exclude: { type: 'boolean' }
      }
    }
  }
}
