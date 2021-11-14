# Change Log
All notable changes to this project will be documented in this file.

## 2.3.23
### Fixed
* Fixed Epic parser in the case where manifests file doesn't specify executable location. Thanks to Discord user @xsessive182 for helping me debug.

## 2.3.22
### Added
* Better UI for enabling and disabling parsers. This can still be done from within the parsers themselves but inaddition there are now toggles on the navigation bar on the right, as well as an "enable/disable" all toggle.
* Documented issue discovered by Discord user @KiwiKitten that Steam parser only works for Steam games that appear in at least one category.

## 2.3.21
### Fixed
* Fixed OS Version in About page
### Changed
* Migrated to new repository as part of SteamGridDB organization.

## 2.3.20
### Fixed
* Fixed local icons
* Fixed epic parser in the case that you had previously moved your epic library

## 2.3.19
### Added
* Icon support! Icons are now on equal footing with other types of artwork and can be added from SGDB. Thanks @Davejl2006 for reminding me that custom icons are worth having.

## 2.3.18
### Changed
* Updated several backend packages (for example node version went from 9 to 14.1.18 LTS)
* Removed bluebird. 
### Fixed
* Logos got broken by a previous update that was using an outdated version of steam-categories. That is now fixed.

Thanks to [Maykin-99](https://github.com/Maykin-99) for these much needed changes!

## 2.3.17
### Fixed
* Steam Parser should not to try to give images for tools (appids like xxx\_yyyy)

## 2.3.16
### Changed
* Enabled steamgriddb as image provider by default in new parsers
### Fixed
* Incorrect tracking of steam directories
* Steam Parser not handling games that were deleted from the steam store ([issue 232](https://github.com/doZennn/steam-rom-manager/issues/232))

## 2.3.15
### Fixed
* Possibility of steam parser breaking because of a slightly different shortcuts.vdf key.

## 2.3.13
### Fixed
* Fixed default image field calling backslashes invalid
### Changed
* Default behavior is to not auto-delete shortcuts for disabled parsers

### 2.3.12
### Fixed
* Epic parser now launches games from epic launcher, allowing for the use of epic online services

## 2.3.11
### Fixed
* Steam parser got borked by something valve changed. This version fixes it. 

## 2.3.10
### Fixed
* Slight oversight on dirty hack

## 2.3.9
### Fixed
* Dirty hack to make user accounts field mandatory only on steam parser

## 2.3.8
### Added
* Experimental Epic Games Parser + Preset (works on Windows and Mac)
### Changed
* Made User Accounts field mandatory for the Steam Parser

## 2.3.7
### Fixed
* Steam parser was failing whenever app title was just a number (eg "140")

## 2.3.6
### Added
* Retroarch Cores environment variable

## 2.3.5
### Fixed
* Made auto updater styling consistent with rest of application

## 2.3.4
### Fixed
* Small backend error when user specified no categories

## 2.3.3
* Unbork browse for files

## 2.3.2
### Fixed
* Filter by category also removing titles in all artwork view
* Round download percentage for auto updater

## 2.3.1
### Fixed
* Filter by category not working in all artwork view
* Include latest.yml in build so auto updater can work

## 2.3.0
### Fixed
* Moved data migrations to modifiers 
### Added
* Add documentation emphasizing User Accounts field
* Steam Parser Title Modifier (default to removing illegal symbols)
* Add a localImagesDir environment variable
* Add a sane browse button to localimages/defaultimages fields
* Exceptions manager
* Add steam category filter to preview
* Add save images locally to preview
* Crash logging with sentry.io
* Auto Updater (hopefully working, sort of hard to test separately)
* Config Presets are searchable

### Changed
* Re organized Parser fields slightly to make more sense
* Split user presets into separate files

## 2.2.34
### Fixed
* Bug where app list would fail to generate if width/height of images could not be retrieved.

### Added
* More logging for steam parser.

## 2.2.33
### Fixed
* Categories not deleting when user hits remove all in settings as opposed to preview
* Major bug in 2.2.32 that prevented steam-categories from working *unless* emoji or non english character was present (don't ask)

## 2.2.32
### Added
* Capability to save categories with emojis or non English characters in the name
### Fixed
* SRM failing to save whenever there are non standard unicode characters in the `leveldb`

## 2.2.31
### Fixed
* Valve changed a database field

## 2.2.30
### Fixed
* Certain parser fields not showing up in Advanced.

## 2.2.29
This is a big one.
### Added
* Environment variables specified in settings, `steamdirglobal` and `retroarchpath`
* Steam Parsers (experimental), which can manage artwork for specified steam accounts

## 2.2.28
### Fixed
* Fixed longstanding issue (since 2.2.20) where UI would lock up when selecting directories that contained many files, eg. the steam directory. This problem was pronounced on systems that used HDD's, and was fixed by dropping webkitdir in favor of electron's showOpenDialog.

## 2.2.27 -2020-05-23
### Hotfix
* 2.2.26 broke retro-arch cores. This issue has been fixed in this release.

## 2.2.26 - 2020-05-21
### Added
* Better state management for category manager (no more duplicate categories, empty SRM managed categories get deleted)
* Custom Arguments JSON file capability + documentation
### Changed
* Readme now points to github pages with videos
### Fixed
* Fixed issue of linux version not saving images

## 2.2.25 - 2020-05-12
### Added 
* Setting for whether or not to delete shortcuts from disabled parsers
* Ability to see number of titles in preview and in test parser logs
* Environment variables ${/} and ${srmdir} that can be used even in steam directory, rom directory fields. 
### Changed 
* Removed retrogaming.cloud from list of image providers (it is defunct)
* Changed structure of AddedItemsV2.json to include Parser ID
* Added lontanadascienza as a contributor
### Fixed
* A bunch of dead links in Readme and About Markdown

## 2.2.23 - 2020-01-27
### Added 
* Improved documentation for custom variables based on advice of a friend.

### Fixed
* Fixed parsers deleting custom logo positions on re parsing (note they will still delete if that app's name changes - SRM will not yet relocate the old json file to the new name)
* Fixed downloading borders not showing in all artwork view

## 2.2.22 - 2020-01-24
### Added
* Added resolutions to images
* Added an "All Artwork" view

### Fixed
* Fixed pngs not replacing jpgs
* Fixed state management (no more duplicate shortcuts)

## 2.2.21 - 2020-01-15
### Added
* Got Logos working
* Got Recent Images working
## 2.2.19 - 2019-03-09

### Changed

* Updated `steamgriddb` url.

## 2.2.18 - 2018-08-17

### Changed

* `retrogaming.cloud` is now turned of by default for new users.

### Fixed

* Fixed issue #111.

## 2.2.17 - 2018-07-15

### Added

* Added `${os:[win|mac|linux]|on match|no match(optional)}` variable. Can be used to select OS specific extensions and etc.

## 2.2.16 - 2018-06-12

### Changed

* For existing entries, an union of parser categories and already existing categories will be used when saving `VDF` files. This will preserve any user added category.

## 2.2.15 - 2018-04-08

### Changed

* Removed file restriction for `Executable` field. Any valid path can be used for executable.

## 2.2.14 - 2018-04-06

### Fixed

* A bug introduced in `2.2.12` would modify `userSettings` schema. This allows user to save invalid configurations, but would throw an error when trying to load it.

## 2.2.13 - 2018-04-05

### Added

* Added primitive/unlimited cache for fuzzy matcher. Increases performance and can be used to change undesired fuzzy matcher's result by modifying `fuzzyCache.json`.

### Fixed

* Added addition step for `"the"` matching. Fuzzy matcher will now modify and try to match title in the following order:
```
Original title: "Addams Family, The - Pugsley's Scavenger Hunt"

1st try: "The Addams Family - Pugsley's Scavenger Hunt"  (logical)
2nd try: "The - Pugsley's Scavenger Hunt Addams Family"  (just in case)
3rd try: "Addams Family, The - Pugsley's Scavenger Hunt" (original)
```

## 2.2.12 - 2018-03-27

### Removed
* ConsoleGrid support, because it's dead (again...).

### Added

* Configuration preset support has been added. User-made configurations can now be loaded from `configPresets.json` file. This file, together with `customVariables.json`, will be automatically downloaded from github **only** if they don't exist on user's computer. Downloads can be forced from **settings** page.
* Hosted files can be found [here](https://github.com/FrogTheFrog/steam-rom-manager/tree/master/files).

## 2.2.11 - 2018-03-17

### Fixed

* Improved diacritic character handling for fuzzy matcher. For ex. `Pokémon Snap` should now be matched to `Pokemon Snap` with diacritic option enabled.

### Added

* More emulator examples (by **Chocobubba** and **Wesim**).

## 2.2.10 - 2017-11-21

### Fixed

* `Shortcuts.vdf` file would not have elements properly removed. If you had app entry at index 0, followed by other apps, removing app at 0 would not re-index remaining entries. Thus, array element at 0 index would remain empty, forever. This, besides corrupting `vdf`, would result in "`exe` of undefined" error.
* Since the rewrite of `shortcuts.vdf` parser, you could not add Steam categories that were numbers (for ex. 7800, 123, 777, etc.). This is fixed now.

## 2.2.9 - 2017-11-16

### Added

* Fuzzy matcher now has an option to replace diacritic characters to their latin equivalent. Available character list is probably not full, so if you find a missing character be sure to post an issue.
* Parser variable added which can replace diacritic characters to their latin equivalent.
* Added default/fallback image option for when there is no image available.

### Fixed

* `substr` error when glob contains space characters at the start of input.
* Could not add local image manually most of the time due tue file input being removed before callback is fired.

## 2.2.8 - 2017-11-12

### Added

* Parser configuration can now be copied to clipboard in "ready-to-paste" text format.

### Changed 

* Completely rewritten `VDF manager` to ease implementation of new features. Should increase list saving performance. If something breaks, there's always a **backup** VDF!
* Optimized `shortcuts.vdf` parser. Should give a **huge** performance increase for people with a lot of entries.
* Default page changed from `Preview` to `Parsers`.
* Changed generic `vdf` library from [node-vdf](https://github.com/RJacksonm1/node-vdf) to [@node-steam/vdf](https://github.com/node-steam/vdf). Previous one did not properly convert data to `vdf`. This change **might** require to delete `screenshots.vdf` (only if SRM throws an error).

## 2.2.7 - 2017-11-10

### Added

* Executable modifier field is now available. Now you can modify executable, append/prepend custom data.

### Changed 

* Arguments are now appended to executable by default.
* A lot of fields are now trimmed for whitespace.

### Fixed 

* Added missing and fixed incorrect whitespace validation.

## 2.2.6 - 2017-11-09

### Added

* Titles, not found in `customVariables.json` can now be failed (skipped). Useful for MAME and similar emulators.

### Fixed 

* Empty titles (with a length of a 0) will now be failed (skipped) by a parser.

## 2.2.5 - 2017-11-07

### Added

* Image and icon indexes will now persist from **previously** generated list. This means that if your newly generated list overwrites apps with the **same** `APPID`, you should see previously selected images/icons.
* Local images with `png`, `tga`, `jpg` and `jpeg` extensions can now be added to image pool manually in preview page.

### Fixed

* Field `Image pool` will have highlighting enabled.
* `#` is now encoded for local files.
* UTF-8 BOM is now properly removed from read files.
* Custom-input field will not scroll when trying to select text while scrolling. The downside is that it will loose focus when mouse is not hovering input element itself. Can be fixed with Chromium v60 which is yet to be implemented in Electron.

### Changed

* Fuzzy parser will now look for `..., The...` segment first. Before it looked for it after no matches were found. That, however, sometimes returned false positives which resulted in `..., The...` segment replacement being skipped. Click [here](https://regex101.com/r/o2DCJ7/2) to see how it does it.
* Changed image size from `cover` to `contain` in preview menu, because Steam seems to be doing it for non-standard images.

## 2.2.4 - 2017-10-27

### Fixed

* Users with configuration made in v2.0.0 could not migrate to older versions due to `Glob-regex` and `Glob-Regex` type mismatch.

## 2.2.3 - 2017-10-10

### Fixed

* `regex` function variable would use substitution.
* Single line text input fields will now have newlines removed on paste.

### Changed

* Updated command line examples to use `${exeDir}`.

## 2.2.2 - 2017-10-09

### Fixed

* `Glob-regex` would not accept `g` flag.

## 2.2.1 - 2017-10-07

### Added

* Parser configuration title together with Steam categories is now shown on generated app entry.
* Custom text input fields.
* Variable bracket highlighting in input fields. 
* Information about color codes near configuration title.
* Missing backend validation.
* Experimental custom variable support.

### Changed

* Steam categories are no longer in advanced options.

### Fixed

* Some typos in FAQ.

## 2.2.0 - 2017-09-30

#### A lot of additions/changes/fixes are not listed here due to unfortunate misclicks which commit changes before I am able to record them.

### Added
* Parser support to local images and local icons.
* Temporary glob cache.
* Settings button to reset fuzzy list.
* Warning is now shown if no user account found.
* Option to disable the usage of Steam account credentials.
* App's position and state will now persist. Except for maximized state, it's currently a little buggy.
* User can now disable current Steam images that are shown in preview.
* SRM now detects changes in parser configuration. These changes will persist until user presses "Save" or decides to undo all changes. Changes will be lost if user exits app.
* Deleted configurations are can now be restored until app is closed.
* User can now specify a custom "Start In" directory.
* Parser configurations and app settings will now be strictly validated. If they are corrupted beyond recovery, error will be shown to fix errors manually.
* Parser configurations and app settings from now will have versions. This will allow to automatically upgrade, update or remove deprecated entries.
* A lot of new variables are now available for users to further customize "stuff".
* App can now automatically clear log before testing parser.
* Navigation panel can now be resized. Maximum allowed width is 25% of viewport width.
* Configuration unsaved status is now reflected near its title in navigation. It also shows if configuration is disabled or not.
* Image urls are now cached for a session.
* Steam categories now support variables.
* Image pool field has been exposed.

### Changed
* Changed fuzzy library from [fuzzy](https://github.com/mattyork/fuzzy) to [fuzzaldrin-plus](https://github.com/jeancroy/fuzz-aldrin-plus).
* Parser configuration will now have `disable` option instead of `enable`. Should be less confusing.
* Recursive form is now adapted to work with angular's reactive forms. Makes validation and change tracking easier.
* Toggle button now uses css animations instead of svg.
* Rewritten **Preview** page to improve performance when handling A LOT of apps.
* Title modifier now supports and uses variables.
* Image url retrieving is now aborted instantly.
* Rewritten variable parser to support nested variables.

### Fixed
* Empty executable is now allowed.
* A logic "bug" for `retrogaming.cloud`. If filter is enabled, titles will be filtered out before making queries `retrogaming.cloud`. This will dramatically decrease number of timeouts. Big thanks to **AlexDobeck** for finding and providing a fix for this.
* Fixed a bug where `retrogaming.cloud` could not be stopped.
* Fixed various bugs related to parser form.

## 2.1.1 - 2017-08-09
### Added
* CMD examples for Nestopia and Project64.

### Fixed
* Initial image size would remain at 40% if preview menu was opened without an already generated list.
* Image size would not save if user exists app in preview menu.

## 2.1.0 - 2017-08-08
### Added
* Ability to select image providers both globally and per user configuration.
* Markdown support.
* Info button for each field.
* ConsoleGrid support (not dead, huh?).
* App list instant filter field.
* Multi-language support.
* Proper `node-glob` patterns support for `glob` and `glob-regex` parsers:
    * `*` Matches 0 or more characters in a single path portion.
    * `?` Matches 1 character.
    * `[...]` Matches a range of characters, similar to a RegExp range. If the first character of the range is `!` or `^` then it matches any character not in the range.
    * `!(pattern|pattern|pattern)` Matches anything that does not match any of the patterns provided.
    * `?(pattern|pattern|pattern)` Matches zero or one occurrence of the patterns provided.
    * `+(pattern|pattern|pattern)` Matches one or more occurrences of the patterns provided.
    * `*(a|b|c)` Matches zero or more occurrences of the patterns provided.
    * `@(pattern|pat*|pat?erN)` Matches exactly one of the patterns provided
    * `**` If a "globstar" is alone in a path portion, then it matches zero or more directories and subdirectories searching for matches. It does not crawl symlinked directories.

### Changed
* `ng-select` now supports multi-select.
* Invalid configurations can now be saved.
* Each image provider now runs in their own instance of web worker.
* Fuzzy matcher was split into 3 parts: loader, matcher and service.
* Code font from "Monaco" to "Hack".
* Instruction were rewritten in markdown.
* Parser form no longer uses Angular's form module. A new "recursive" module is now used to create parser form.
* Drastically reduced the amount of css variables.
* Layout changed to support `CSS grid`.

### Fixed
* `Observable` settings load logic bug.
* Url encoding bug (issue #27).

### Removed
* Color picker module can no longer be accessed and is used for development only.

## 2.0.1 - 2017-06-12
### Fixed
* Url retrieving would silently stop after 3 timeouts. Now they stop after 3 failures, not timeouts, as intended.

## 2.0.0 - 2017-06-11
### Added
* 2 new options for fuzzy matcher.
* Online image query option allows to specify search string for images.
* Image urls can now be redownloaded per game only (without regenerating a list).
* Specific account support added. This allows to make different configuration for different accounts.
* New settings windows has been added.
* Images can now be preloaded as soon as they are retrieved.
* Images can now be filtered for non-related images (select this option in settings window).
* Fuzzy matcher has it's own Event log option now. This will reduce the clutter.
* Timeout support added for `retrogaming.cloud`. After requested timeout, images will continue to download.
* New nagging message will now announce when all downloads are complete.
* User configurations and user settings (new in this release) will now be validated. Incorrect structure types will be replaced with default values (it will add missing options for new APP versions).

### Changed
* Parser no longer needs executable location. If left empty, a file, returned by parser, will be used as executable. This allows to use custom batch files that do not require executable. Technically, any non-steam game can be added now.
* Title prefix and suffix fields replaced by one `Title modifier` field.
* Changed list data merging from `title` to `appID`. This means that games may now have the same titles, BUT they must have different executable path (case sensitive).
* Image retrieve logic. Images are now retrieved in background, allowing user to view currently available images.
* Internal data structure has changed to allow unique configurations for multiple apps per multiple user accounts per multiple directories.
* Using the new API for `SteamGridDB`.

### Fixed
* Properly show image url retrieve errors.

### Removed
* Preferred image list is removed as it is impossible to implement with background image downloader.
* ConsoleGrid support, because it's dead.
* Greedy mode option.

## 1.1.4 - 2017-05-02
### Fixed
* `shortcuts.vdf` should now have recurring titles removed as intended. If you had titles disappear, it was because Steam changed `AppName` property to `appname`. That resulted in too many titles and Steam got confused. Simply re-adding all titles via SRM should fix it as it will delete duplicates.

## 1.1.3 - 2017-05-01
### Added
* Greedy search option which will search for images using both `${title}` and `${fuzzyTitle}`

### Fixed
* Added a temporary fix, which should prevent `shortcuts.vdf` corruption

## 1.1.2 - 2017-05-01
### Added
* Additional one time backups will be made with extension `.firstbackup`

### Changed
* Glob-regex now joins capture pairs. See [here](https://regex101.com/r/xasqq9/2) how it can be used

### Fixed
* Alert component now times out as intended (previously it would just stay there until user clicked it or it received a new message to display)

## 1.1.1 - 2017-05-01
### Changed
- You won't be forced to shut down Steam anymore, but will be adviced to, everytime you generate a list

## 1.1.0 - 2017-05-01
### Added
- Offline mode

### Changed
- In order to release binaries for multiple platforms, Steam check is done only on Windows
- User data is now located at: `%APPDATA%\steam-rom-manager\userData` (Windows) or `~/.config/steam-rom-manager/userData` (linux)

## 1.0.0 - 2017-04-30
### Added
- Everything
