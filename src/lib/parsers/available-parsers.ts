export const availableParsers = [
  'Glob',
  'Glob-regex',
  'Manual',
  'Amazon Games',
  'Epic',
  'GOG Galaxy',
  'itch.io',
  'Steam',
  'UPlay',
]

// Two parser inputs can't have the same names!
// Hard to fix bug involving schema
export const availableParserInputs: {[parserType: string]: string[]} = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Manual': ['manualManifests'],
  'Amazon Games': ['amazonGamesExeOverride', 'amazonGamesLauncherMode'],
  'Epic': ['epicManifests', 'epicLauncherMode'],
  'GOG Galaxy': ['galaxyExeOverride','gogLauncherMode'],
  'itch.io': ['itchIoAppDataOverride'],
  'Steam': [],
  'UPlay': ['uplayDir','uplayLauncherMode'],
}

export const manualParsers = ['Manual']
export const artworkOnlyParsers = ['Steam']
export const ROMParsers = ['Glob', 'Glob-regex']
export const platformParsers = ['Epic','GOG Galaxy','Amazon Games','UPlay','itch.io']
