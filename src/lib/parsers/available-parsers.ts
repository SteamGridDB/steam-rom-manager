export const availableParsers = [
  'Glob',
  'Glob-regex',
  'Steam',
  'GOG Galaxy',
  'itch.io'
  'Epic',
  'GOG Galaxy',
  'Amazon Games',
  'UPlay',
  'Manual'
]

// Two parser inputs can't have the same names!
// Hard to fix bug involving schema
export const availableParserInputs: {[parserType: string]: string[]} = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Steam': [],
  'itch.io': ['itchIoAppDataOverride']
  'Epic': ['epicManifests', 'epicLauncherMode'],
  'GOG Galaxy': ['galaxyExeOverride','gogLauncherMode'],
  'Amazon Games': ['amazonGamesExeOverride', 'amazonGamesLauncherMode'],
  'UPlay': ['uplayDir','uplayLauncherMode'],
  'Manual': ['manualManifests']
}

export const manualParsers = ['Manual']
export const artworkOnlyParsers = ['Steam']
export const ROMParsers = ['Glob', 'Glob-regex']
export const platformParsers = ['Epic','GOG Galaxy','Amazon Games','UPlay','itch.io']
