export const availableParsers = [
  'Glob',
  'Glob-regex',
  'Steam',
  'Epic',
  'GOG Galaxy',
  'UPlay',
  'Manual'
]

// Two parser inputs can't have the same names!
// Hard to fix bug involving schema
export const availableParserInputs: {[parserType: string]: string[]} = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Steam': [],
  'Epic': ['epicManifests', 'epicLauncherMode'],
  'GOG Galaxy': ['galaxyExeOverride','gogLauncherMode'],
  'UPlay': ['uplayDir','uplayLauncherMode'],
  'Manual': ['manualManifests']
}

export const manualParsers = ['Manual']
export const artworkOnlyParsers = ['Steam']
export const ROMParsers = ['Glob', 'Glob-regex']
export const platformParsers = ['Epic','GOG Galaxy','UPlay']
