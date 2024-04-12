import * as json from '../helpers/json';
import { ParserType, SuperType } from '../../models';
// Two parser inputs can't have the same names!
// Reason: Hard to fix bug involving schema

export const availableParserInputs: Record<ParserType, string[]> = {
  'Glob': ['glob'],
  'Glob-regex': ['glob-regex'],
  'Manual': ['manualManifests'],
  'Amazon Games': ['amazonGamesExeOverride', 'amazonGamesLauncherMode'],
  'Epic': ['epicManifests', 'epicLauncherMode'],
  'Legendary': ['legendaryInstalledFile'],
  'GOG Galaxy': ['galaxyExeOverride','gogLauncherMode','parseLinkedExecs'],
  'itch.io': ['itchIoAppDataOverride','itchIoWindowsOnLinuxInstallDriveRedirect'],
  'Steam': ['onlyGames','onlyInstalled','sourceMods'],
  'UPlay': ['uplayDir','uplayLauncherMode'],
  'UWP': ['UWPDir', 'UWPLauncherMode'],
  'EA Desktop': ['eaGamesDir','eaLauncherMode']
};

export const availableParsers: ParserType[] = Object.keys(availableParserInputs) as ParserType[];

export const superTypes: Record<SuperType, ParserType[]> = {
  'Manual': ['Manual'],
  'ArtworkOnly': ['Steam'],
  'ROM': [
    'Glob',
    'Glob-regex'
  ],
  'Platform': [
    'Epic',
    'Legendary',
    'GOG Galaxy',
    'Amazon Games',
    'UPlay',
    'itch.io',
    'UWP',
    'EA Desktop'
  ]
};

export const superTypesMap: Record<ParserType, SuperType> = json.multiInvert<SuperType, ParserType>(superTypes);

export const ManualType: SuperType = 'Manual'
export const ROMType: SuperType = 'ROM'
export const PlatformType: SuperType = 'Platform'
export const ArtworkOnlyType: SuperType = 'ArtworkOnly'
