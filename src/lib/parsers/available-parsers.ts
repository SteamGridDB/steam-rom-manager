export const availableParsers = [
  'Glob',
  'Glob-regex',
  'Steam',
  'Epic',
  'GOG Galaxy',
  'UPlay',
  'Manual'
]

export const availableParserInputs: {[parserType: string]: string[]} = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Steam': [],
  'Epic': ['manifests', 'epicLauncherMode'],
  'GOG Galaxy': ['galaxyExeOverride','gogLauncherMode'],
  'UPlay': ['uplayDir','uplayLauncherMode'],
  'Manual': ['manifests']
}

export const manualParsers = ['Manual']
export const artworkOnlyParsers = ['Steam']
export const ROMParsers = ['Glob', 'Glob-regex']
export const platformParsers = ['Epic','GOG Galaxy','UPlay']
