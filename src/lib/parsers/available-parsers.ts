import * as json from '../helpers/json';

// Two parser inputs can't have the same names!
// Reason: Hard to fix bug involving schema
export const availableParserInputs: {[parserType: string]: string[]} = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Manual': ['manualManifests'],
  'Amazon Games': ['amazonGamesExeOverride', 'amazonGamesLauncherMode'],
  'Epic': ['epicManifests', 'epicLauncherMode'],
  'GOG Galaxy': ['galaxyExeOverride','gogLauncherMode'],
  'itch.io': ['itchIoAppDataOverride','itchIoWindowsOnLinuxInstallDriveRedirect'],
  'Steam': [],
  'UPlay': ['uplayDir','uplayLauncherMode'],
  'EA Desktop': ['eaGamesDir']
}

export const availableParsers = Object.keys(availableParserInputs);

export const superTypes: {[superType: string]: string[]} = {
  'Manual': ['Manual'],
  'ArtworkOnly': ['Steam'],
  'ROM': ['Glob','Glob-regex'],
  'Platform': ['Epic','GOG Galaxy','Amazon Games','UPlay','itch.io', 'EA Desktop']
}

export const superTypesMap: {[parserType: string]: string | string[]} = json.multiInvert(superTypes);

export const ManualType = 'Manual'
export const ROMType = 'ROM'
export const PlatformType = 'Platform'
export const ArtworkOnlyType = 'ArtworkOnly'
