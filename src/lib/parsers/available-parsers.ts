export const availableParsers = [
  'Glob',
  'Glob-regex',
  'Epic',
  'Steam'
]

export const availableParserInputs: {[parserType: string]: string[]} = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Steam': [],
  'Epic': ['manifests']
}
