# Changelog
All notable changes to this project will be documented in this file.

## 2.5.0
### Added
* Ability to set Proton version per parser [TODO]
* Ability to prioritize artwork by certain authors [TODO]

### Changed
* Allow function variables in environment variable fields. One use case being to set start-in-directory based on the os ([issue 292](https://github.com/SteamGridDB/steam-rom-manager/issues/292)).
* Added back image provider to apps in EmuDeck theme.
* View Games and About pages now in EmuDeck theme.

### Fixed
* Some graphical issues with loading spinner placements

## 2.4.29
### Added
* Non-SRM Shortcuts Artwork Only Parser.
### Changed
* Don't show artwork only apps when doing excludes (this didn't work anyway, since nothing is being added).

## 2.4.28
### Added
* Parsing of executable arguments in executable mode for GOG, Amazon, Epic, EA Desktop, and Legendary (resolves [issue 263](https://github.com/SteamGridDB/steam-rom-manager/issues/263)). Previously these were being ignored. As far as I can tell UPlay, UWP, and Itch.io never pass commandline arguments to executables.

### Fixed
* Read controller templates blocking renderer process. Should fix the issue some people have had with SRM freezing when hitting save to steam.
* Possible error when writing localconfig.vdf to enable/disable steam input.


## 2.4.27
### Added
* Ability to filter by artwork size for banners, heroes, and icons.
* Ability to sort exceptions by date, old title, and new title ([issue 343](https://github.com/SteamGridDB/steam-rom-manager/issues/343))
* Option to hide steam username from preview.
### Fixed
* Some newer titles missing from Battle.net parser (thanks @doZennn)
### Changed
* Hide API options for SteamGridDB if it isn't selected as an image provider.

## 2.4.26
### Added
* Battle.net parser ⚔️🔥 ([issue 352](https://github.com/SteamGridDB/steam-rom-manager/issues/352))

## 2.4.25
### Added
* Toggle to filter by apps missing artwork (resolves [issue 407](https://github.com/SteamGridDB/steam-rom-manager/issues/407))
### Fixed
* Renderer blocking when running XBox UWP parser
### Changed
* Filter out DMCA'd artwork.
* Split custom variables file ([issue 260](https://github.com/SteamGridDB/steam-rom-manager/issues/260)). Thanks @kencinder.
* Moved filters for preview page into a side panel.
* Automatically download new custom variables on startup.

## 2.4.24
### Added
* Toggle in settings to disable auto update ([issue 612](https://github.com/SteamGridDB/steam-rom-manager/issues/612))
* Capability to add EmuDeck specific features.

### Fixed
* Renderer blocking when removing extraneous artwork (should resolve many performance issues when large number of ROMs are being handled)
* Possible failure to load of `View Games` page if `userdata/0` folder present.
* Flatpak build process working again

## 2.4.23
### Added
* Support for Xbox One Elite, PS5 Dualsense Edge, and Steam Controller templates (resolves [issue 555](https://github.com/SteamGridDB/steam-rom-manager/issues/555) and [issue 656](https://github.com/SteamGridDB/steam-rom-manager/issues/656))
### Fixed
* Glob and Glob-Regex parser would fail if roms directory was set to the root of a drive on windows. ([issue 580](https://github.com/SteamGridDB/steam-rom-manager/issues/580))


## 2.4.22
### Fixed
* Regression introduced in 2.4.20 resulting in `ENOENT` errors

## 2.4.21
### Added
* SRM now remembers your sgdb artwork choices (caching sgdbId -> artworkId). It will remember these choices even if you delete your `config/grids` folder or if you change a game's app id.
* Artwork choices are stored in SRM's config directory under `artworkCache.json`. Moving this file to a new SRM install will instantly reproduce your artwork choices.
* Per parser option to backup SGDB artwork locally. Useful for parsers that experience frequent DRM takedowns. 
* Artwork backups are stored in SRM's config directory under `artworkBackups/`. Moving this directory to a new SRM install will allow use of the backed up artwork.

### Changed
* SRM will now always list artwork in the same order: First whatever is currently in steam if available, then local artwork if available, then the cached sgdb image if available, then other sgdb images.


## 2.4.20
### Added
* Ability to Enable/Disable steam input per parser ([a much requested feature](https://github.com/SteamGridDB/steam-rom-manager/issues/562))
* Ability to set `appendArgsToExecutable` from manual parser (resolves [issue 625](https://github.com/SteamGridDB/steam-rom-manager/issues/625))
* Controller Template information on View Games page.
### Fixed
* Create `grid` directory in Steam if it does not already exist (resolves [issue 600](https://github.com/SteamGridDB/steam-rom-manager/issues/600))


## 2.4.19
### Added
* Ability to search games on view games page
### Fixed
* Styling regression on "all artwork" view in non-EmuDeck themes
* Titles with LaunchOptions not launching from View Games page
* Regression that prevented fix match from working on "all artwork" view.

## 2.4.18
### Added
* View Games page, ability to see what artwork and games are currently in steam without opening steam
* `Parse Linked Execs` toggle for GOG Galaxy parser, allowing the parsing of games that were not purchased in GOG but instead manually linked.
* Many changes to the EmuDeck theme, thanks to @dragoonDorise

### Fixed
* `EISDIR` upon refresh controller templates if steam had created a directory in the controller templates folder (thanks @SteelSavant)

## 2.4.17
### Fixed
* Fuzzy game name matching
* EmuDeck theme scrollbar
### Changed
* Remove DNS resolution from within SRM

## 2.4.16
### Fixed
* Image timeouts issue should be resolved. If it isn't resolved for you try lowering the batch size in settings.
* Duplicates being added when upgrading from 2.4.14 to 2.4.15.
### Added
* Ability to set batch size for image downloads in settings
### Changed
* Automatically retry image downloads up to 4 times.
* DNS resolution now happens in SRM and uses cacheing.

## 2.4.15
### Added
* Ability to add games to categories created in steam (including `Favorites` and `Hidden`!)
* SRM now respects addition of non SRM managed games to SRM created categories, i.e. it won't delete them.
* Global buttons added to steam directory and user accounts field in parsers.
* Choose Account button added to user accounts field in parsers.
* Added an SGDB search field to the fix match page in preview.
* `Include Visible` and `Exclude Visible` buttons in preview to make adding exceptions even easier.
### Changed
* Requests library changed to `node-fetch`, hopefully fixing timeout issues. But I have been burnt before.
### Fixed
* Fix match was somewhat broken for the artwork only (Steam) parser, wasn't setting the `exceptionId` correctly.
* Subtle bug that prevented `Remove All Added Entries` from doing anything to categories or controllers when Preview hadn't been generated.
* Minor issue where image index wasn't being set to zero after an image was saved to steam (making it seem like the image didn't save even though it did).
* Graphical issue with scrollbar in EmuDeck theme, credit to @DragoonDorise.

## 2.4.14
### Fixed
* Filter out weird '0' userdata directories that were causing problems for people in 2.4.13. I don't have one, so I didn't catch this issue.

## 2.4.13
### Added
* A global environment variable for the user accounts field (planning to eventually make this parser field mandatory)
* A noice modal to set the global user accounts filter from settings.
### Fixed
* Issue where shortcut passthrough wouldn't work on a directory containing only one shortcut.

## 2.4.12
### Added
* Exceptions now usable in EmuDeck theme. Credit to @dragoonDorise.
### Changed
* Use App Id instead of titles for import/export images (gets rid of title collisions and also issues with titles that have illegal filename characters)
* Total re-work of image downloading method to remove dependence on deprecated library `request`. Should also hopefully fix timeout issues, as it now automatically retries (once) if an image request times out.
### Fixed
* A regression in 2.4.6 that would cause import to fail for other artwork types if a grid wasn't present.

## 2.4.11
## Changed
* Some small quality of life UI fixes.

## 2.4.10
## Added
* Show total number of batches in batch progress alerts.
## Fixed
* Some small UI bugs that cropped up in 2.4.9.

## 2.4.9
### Added
* Explanation of SRM's workflow on the preview page when no apps are present. Credit to @dragoonDorise.
* Highlight mandatory fields in create parser.
### Changed
* Moved better-sqlite calls to a child process. This fixes crashes that have been happening since upgrading to `Electron 24`.
* Re-worked module `windows-shortcuts-ps` to use massively less RAM when doing shortcut-passthrough (only spawn one powershell process, per parse, not one per each shortcut).
* Increased api call timeouts.

## 2.4.8
## Added
* Ability to comment things out in glob fields using `\`. Addresses [issue 404](https://github.com/SteamGridDB/steam-rom-manager/issues/404)
* Config presets are now grabbed by version, so that older versions of SRM (from here on out) won't break when breaking changes are made to the presets files (they also won't receive any new presets, but c'est la vie).
## Changed
* Made the whole parser clickable in the parsers list in the `EmuDeck` theme.
## Fixed
* Exceptions ID not matching for steam parser
* CLI would hang on generate apps if no apps were found.
* Handling for bug in `osName` where an error would be thrown if `powershell` not found on a Windows system, [issue 521](https://github.com/SteamGridDB/steam-rom-manager/issues/521)
* Handling for issue where `addedItemsV2.json` could be invalid json. Also made the write synchronous so this is less likely to occur.
## Removed
* Expandable set notation `$()$` that could be used in the local images fields. Classic example of SRM being overcomplicated. I might bring it back if there is popular demand.
* `Skip Accounts with Missing Data Dirs` option (always true now)
* `Use Account Credentials` option (now set based on whether or not `loginusers.vdf` exists)


## 2.4.7
## Fixed
* Fixed possibility of `fix match` creating duplicates or not working, state management changed to incorporate possibility of app id changes better.
## Changed
* Optimizations for `1280x800` screen (Steam Deck). Should stop horizontal scroll bars from appearing.
* Improved consistency of fix match appearance with preview.

## 2.4.6
### Added
* Ability to exclude titles from the preview! Exclusions are automatically saved as exceptions so that the user doesn't have to repeat them. If you want the title back, just go find the exception and get rid of it.
* Ability to set exceptions based on the exact app through an exception ID, e.g. if you have two titles with the same exact name they no longer need to have the same exceptions applied.
### Changed
* Shorten the button text in the bottom bar so as to hopefully minimize overflow issues on the Steam Deck.

## 2.4.5
### Added
* Ability to fix matches from the preview! Just click the little exclamation point on the left of the app (icon subject to change), select the game and boom match fixed. Best of all, SRM will automatically save your change as an exception so that you never have to change it again in the future.
* Exceptions are now searchable.
### Changed
* Preview is now sorted in alphabetical order of title

## 2.4.4
### Fixed
* Regression in 2.4.3: SRM was not remembering the artwork choices that were already in Steam.

## 2.4.3
### Added
* New highly simplified EmuDeck theme (only recommended for EmuDeck users as it hides parser config). Credit to @dragoonDorise.
* Everyone who has made a feature contribution is now in the about page.
* Legacy banner images now sym-linked instead of copied (reduces storage usage by 17%)
* Steam images become sources immediately after hitting save apps to steam. This means that if you have some (or many) SGDB requests time out you can just wait a few seconds and hit "save apps to steam" again and it will get only those images.
### Changed
* Major re-factor of parsers service, parsers component, and preview component. Preparation for new and more powerful preview.
### Fixed
* Glob and Glob Regex parsers with `**` now follow sym-links once more (this was broken by the upgrade to glob 9.0, which no longer follows sym links by default).

## 2.4.2
### Added
* Ability to add artwork for unofficial source mods via the steam parser
* Logging for when steamgriddb times out on an artwork request
### Fixed
* Steam parser was broken in 2.4.1

## 2.4.1
### Fixed 
* Race condition bug in saving images to steam.

## 2.4.0
### Added
* Command line interface! 🚀

Unfortunately on the Windows portable version the CLI can't print anything out (see [electron-builder issue 3998](https://github.com/electron-userland/electron-builder/issues/3998)), but the commands still work. I am tracking this issue and will update `electron-builder` as soon as it is fixed.
* New default UI theme by EmuDeck's @dragoonDorise 🚀
* Batched Image downloading 🚀
 
Solves the issue where SRM would hang on "Writing VDFs" when lots of images were being added. Batching is 500 images (100 games) at a time, with ten seconds in between in order to give SGDB's servers a break.
* Ability to filter by installed status and app type in steam parser (e.g. only get artwork for games, not tools).
* Windows Apps capability for UWP parser.
* Handling for DMCA'd images (SRM doesn't add the "This image has been taken down" fallback to steam)
* MSI Installer
* Helpful placeholders in parser fields.
### Wiki
* [Command Line Interface](https://github.com/SteamGridDB/steam-rom-manager/wiki/Command-Line-Interface)
### Changed
* Re-worked steam parser to no longer require apps be categorized (credit to @Tormak for the technique). May still change in the future
* Bring all SRM dependencies up to date.
### Fixed
* UWP Parser in cases where pulled json has special characters (credit to @tlt21 for the PR).
### Removed
* 32 bit linux application (modern versions of electron don't have prebuilt binaries for ia32 linux).

## 2.4.0
### Planned
* [x] GOG Parser.
* [x] UPlay Parser.
* [x] EA Desktop Parser.
* [x] XBox Game Pass Parser.
* [x] Command Line Interface.
* [x] Capability to override image searches.
* [x] Ability to set per-parser controller templates.
* [x] Platform parsers have launcher and launcherless mode.
* [x] Automatic Preset Updating.
* [x] Make icons work for Steam parser (with the caveat that they will most likely be overwritten when a developer updates their game).

## 2.3.52
### Fixed
* Bug in UPlay parser that could cause it to fail when Ubisoft left stray registry entries for Ubisoft games installed by steam. Thanks to SGDB Discord user djib for helping to debug.
### Changed
* Made it so that the docs page returns to the intro page when clicking new parser, and otherwise changes to the main docs page for whatever parser type is clicked.

## 2.3.51
### Fixed
* EA Parser works for EA Play games (will only add them in launcher mode, skips them in launcherless mode)
* Two UWP parser fixes involving different possible structures for uwp xml and json files. Greatly increases the number of games the parser works for.
* Fix incorrect titles bug for UPlay parser [issue](https://github.com/SteamGridDB/steam-rom-manager/issues/421)
* Hopefully fixed path undefined bug for UPlay parser [issue 355](https://github.com/SteamGridDB/steam-rom-manager/issues/355)
Credit to SGDB Discord user Zedan for helping debug all four of these issues.

## 2.3.50
### Added
* Launcher Mode for EA Desktop Parser
* UWP Parser for XBox Game Pass (credit to @alvaromunoz, great work!)

## 2.3.49
### Added
* Legendary Platform Parser (working on Windows, Linux, and Mac OS)
* Presets for EA Desktop and Legendary Parser

## 2.3.48
### Added
* EA Desktop Platform Parser 🚀
* Several new languages in various stages of translation 🌍. Congrats to everyone who worked on *finishing* the Brazilian Portuguese translation!
### Fixed
* Hopefully fixed scaling issue on steamdeck where scroll bars were being added to preview page.
* Fixed amazon games parser adding games that had been uninstalled ([issue 425](https://github.com/SteamGridDB/steam-rom-manager/issues/425))

## 2.3.47
### Added
* Ability to exclude non-local artwork in exceptions (addresses [issue 398](https://github.com/SteamGridDB/steam-rom-manager/issues/398))
### Fixed
* Image Provider resetting to SGDB even if none was previously selected ([issue 336](https://github.com/SteamGridDB/steam-rom-manager/issues/336))

## 2.3.46
## Added 
* Ability to filter apps by parser title in addition to steam category.
### Fixed
* Significant lag when transitioning from non parser tab to a parser tab, caused by cached controllers templates being destroyed. Fixed by moving them to service.
* Category Filter options getting cleared after leaving the preview page.

## 2.3.45
### Fixed
* Bug where controllers couldn't be fetched if user had a custom config whose title was a number (ugh). Credit to emu-deck Discord user emotion for discovering the bug.
### Changed
* Alphabetization for controller templates (you're right @Godsbane it does look better)

## 2.3.44
### Added
* Ability to import and export artwork choices (credit to @MattMckenzy)
* Ability to override drive letter for itch.io apps running via wine/proton on Linux (credit to @Apalatn)

## 2.3.43
### Added
* Crowdin Localization (credit to @doZennn)
* Ability to remove applied controller templates per parser (and globally in settings)

### Fixed
* Vastly improved state management for controller templates
* Totally re-worked select component to allow dynamically changing options

## 2.3.42
### Added
* Steam Deck per-parser controller templates
### Fixed
* Issue where games with special characters in their names couldn't have their controller templates set

## 2.3.41
### Added
* Ability to set per-parser controller templates, a [long requested feature](https://github.com/SteamGridDB/steam-rom-manager/issues/13)
### Fixed
* Steam Parser broke because valve changed the binary encoding of `appinfo.vdf`. See [here](https://github.com/cbartondock/node-binary-vdf).

## 2.3.40
### Added
* Ability to open the config directory from settings.
### Fixed
* Incorrect image queries for shortcut passthrough of .desktop files on Linux.
* Fixed weird bug involving a race condition on `.bind(env)`, resulting in the error:
```
Error: File Parser Execution:
  TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
```

## 2.3.39
### Fixed
* Logging of vdf merging errors (no longer produces blank errors sometimes)
* `this.fileData.shortcuts.push` error. Hopefully.

## 2.3.38
### Added
* Made itch.io fully cross platform (thanks @OneMoreByte for the PR).
* Capacity to build flatpaks! (Only on linux)
* Built in bug-reporter. Thanks @doZennn for making an awesome bug-reporting server!
### Changed
* Better errors when SGDB can't find a matching title (no more 'Unknown Error').
### Fixed 
* Excluding titles and forcing a name change caused an error as of 2.3.37 [Issue 308](https://github.com/SteamGridDB/steam-rom-manager/issues/308)
* .desktop shortcut passthrough now works in the flatpak version of srm.

## 2.3.37
### Added
* Ability to do shortcut passthrough for `.desktop` shortcuts on Linux (thanks @UndarkAido for the PR).
### Changed
* Totally re-factored the `executeFileParsers` method to use an actually sane promise stack. As an added bonus, the refactoring allowed for per parser error logging and for exceptions to overrule the results of shortcut passthrough.

## 2.3.36
### Fixed
* Added handling to UPlay parser to simply not add games whose path is not stored in the registry (thanks @CheezyFriez12 for helping to debug).
* Shortcut passthrough for `.lnk` files no longer drops arguments and start dir ([Issue 227](https://github.com/SteamGridDB/steam-rom-manager/issues/227)).
* Platform parser launcher mode arguments no longer added in launcherless mode.
### Changed
* Also log start in directory.

## 2.3.35
### Added
* Itch.io parser (thanks @lexarvn)

## 2.3.34
### Fixed
* Title sanitization yet again.
* Epic manifests not showing
### Added
* Ability to handle animated artwork
* Amazon Games parser (thanks @lexarvn)
* Exposed API options for SteamGridDB: style, nsfw, humor, and image motion types

## 2.3.33
### Fixed
* Actually fixed the title sanitization issue in `screenshots.vdf`. [Issue 296](https://github.com/SteamGridDB/steam-rom-manager/issues/296).
* Fixed [Issue 284](https://github.com/SteamGridDB/steam-rom-manager/issues/284) and [Issue 278](https://github.com/SteamGridDB/steam-rom-manager/issues/278)

## 2.3.32
### Added
* UPlay Parser.
### Changed
* Prettied up the settings page further.
### Fixed
* Now properly sanitizing the titles put into `screenshots.vdf`.
* Fixed the change in 2.3.31 that prevented GOG/Epic Parser from working unless directory overrides were set.

## 2.3.31
### Added 
* Experimental parser sections. If people don't like them they can be removed, but I think they clean up the parsers significantly.
* Manual Parser. Ability to specify shortcut info in JSON files, thanks @CarJem for the PR.
* Global ROMs Directory environment variable. 
### Fixed
* Environment variables now work in parser inputs.
### Changed
* Brought settings UI more into line with the rest of the app, and added documentation.
* Removed "Show Advanced" and "Disable Parser" (disable parser is now on the sidebar only)

## 2.3.30
### Fixed
* Fixed [Issue 288](https://github.com/SteamGridDB/steam-rom-manager/issues/288). Thanks @Witherking25.

## 2.3.29
### Fixed
* Fixed [Issue 239](https://github.com/SteamGridDB/steam-rom-manager/issues/239)

## 2.3.28
### Added
* Allow exact gameid in search title override (also added documentation). Thanks to @kencinder for suggesting this.

## 2.3.27
### Added 
* Automatic Preset Updating
* New Icon
* Search Title Override in Exceptions Manager
### Fixed
* A stray paranthesis in a preset.

## 2.3.26
### Fixed
* Potential error in GOG Parser when details are missing (for now it just won't add the game).
* Fixed existing icons not populating from grids folder.

## 2.3.25
### Added
* GOG Parser.
* Epic and GOG parsers have launcherless option.
### Fixed
* appid Field is now set correctly in `shortcuts.vdf`
* Icons no longer can be set to exes (which would result in those exe's being copied to grids folder)

## 2.3.24
### Added
* Ability to override manifests directory in epic parser (so that for example the Legendary store can be used instead).
### Changed
* Totally refactored parserInputs in userConfigurations and presets to allow for less clutter and more varied parsers in the future.

## 2.3.23
### Fixed
* Fixed Epic parser in the case where manifests file doesn't specify executable location. Thanks to Discord user @xsessive182 for helping me debug.

## 2.3.22
### Added
* Better UI for enabling and disabling parsers. This can still be done from within the parsers themselves but inaddition there are now toggles on the navigation bar on the right, as well as an "enable/disable" all toggle.
* Documented issue discovered by Discord user @KiwiKitten that Steam parser only works for Steam games that appear in at least one category.

## 2.3.21
### Fixed
* Fixed OS Version in About page.
### Changed
* Migrated to new repository as part of SteamGridDB organization.

## 2.3.20
### Fixed
* Fixed local icons.
* Fixed epic parser in the case that you had previously moved your epic library.

## 2.3.19
### Added
* Icon support! Icons are now on equal footing with other types of artwork and can be added from SGDB. Thanks @Davejl2006 for reminding me that custom icons are worth having.

## 2.3.18
### Changed
* Updated several backend packages (for example node version went from 9 to 14.1.18 LTS).
* Removed bluebird. 
### Fixed
* Logos got broken by a previous update that was using an outdated version of steam-categories. That is now fixed.

Thanks to [Maykin-99](https://github.com/Maykin-99) for these much needed changes!

## 2.3.17
### Fixed
* Steam Parser should not to try to give images for tools (appids like xxx\_yyyy).

## 2.3.16
### Changed
* Enabled steamgriddb as image provider by default in new parsers.
### Fixed
* Incorrect tracking of steam directories.
* Steam Parser not handling games that were deleted from the steam store ([issue 232](https://github.com/doZennn/steam-rom-manager/issues/232)).

## 2.3.15
### Fixed
* Possibility of steam parser breaking because of a slightly different shortcuts.vdf key.

## 2.3.13
### Fixed
* Fixed default image field calling backslashes invalid.
### Changed
* Default behavior is to not auto-delete shortcuts for disabled parsers.

### 2.3.12
### Fixed
* Epic parser now launches games from epic launcher, allowing for the use of epic online services.

## 2.3.11
### Fixed
* Steam parser got borked by something valve changed. This version fixes it. 

## 2.3.10
### Fixed
* Slight oversight on dirty hack.

## 2.3.9
### Fixed
* Dirty hack to make user accounts field mandatory only on steam parser.

## 2.3.8
### Added
* Experimental Epic Games Parser + Preset (works on Windows and Mac).
### Changed
* Made User Accounts field mandatory for the Steam Parser.

## 2.3.7
### Fixed
* Steam parser was failing whenever app title was just a number (eg "140").

## 2.3.6
### Added
* Retroarch Cores environment variable.

## 2.3.5
### Fixed
* Made auto updater styling consistent with rest of application.

## 2.3.4
### Fixed
* Small backend error when user specified no categories.

## 2.3.3
### Fixed
* Unbork browse for files.

## 2.3.2
### Fixed
* Filter by category also removing titles in all artwork view.
* Round download percentage for auto updater.

## 2.3.1
### Fixed
* Filter by category not working in all artwork view.
* Include latest.yml in build so auto updater can work.

## 2.3.0
### Fixed
* Moved data migrations to modifiers.
### Added
* Add documentation emphasizing User Accounts field.
* Steam Parser Title Modifier (default to removing illegal symbols).
* Add a localImagesDir environment variable.
* Add a sane browse button to localimages/defaultimages fields.
* Exceptions manager.
* Add steam category filter to preview.
* Add save images locally to preview.
* Crash logging with sentry.io.
* Auto Updater (hopefully working, sort of hard to test separately).
* Config Presets are searchable.
### Changed
* Re organized Parser fields slightly to make more sense.
* Split user presets into separate files.

## 2.2.34
### Fixed
* Bug where app list would fail to generate if width/height of images could not be retrieved.
### Added
* More logging for steam parser.

## 2.2.33
### Fixed
* Categories not deleting when user hits remove all in settings as opposed to preview
* Major bug in 2.2.32 that prevented steam-categories from working *unless* emoji or non english character was present (don't ask).

## 2.2.32
### Added
* Capability to save categories with emojis or non English characters in the name.
### Fixed
* SRM failing to save whenever there are non standard unicode characters in the `leveldb`.

## 2.2.31
### Fixed
* Valve changed a database field.

## 2.2.30
### Fixed
* Certain parser fields not showing up in Advanced.

## 2.2.29
### Added
* Environment variables specified in settings, `steamdirglobal` and `retroarchpath`.
* Steam Parsers (experimental), which can manage artwork for specified steam accounts.

## 2.2.28
### Fixed
* Fixed longstanding issue (since 2.2.20) where UI would lock up when selecting directories that contained many files, eg. the steam directory. This problem was pronounced on systems that used HDD's, and was fixed by dropping webkitdir in favor of electron's showOpenDialog.

## 2.2.27
### Fixed
* 2.2.26 broke retro-arch cores. This issue has been fixed in this release.

## 2.2.26
### Added
* Better state management for category manager (no more duplicate categories, empty SRM managed categories get deleted).
* Custom Arguments JSON file capability + documentation.
### Changed
* Readme now points to github pages with videos.
### Fixed
* Fixed issue of linux version not saving images.

## 2.2.25
### Added 
* Setting for whether or not to delete shortcuts from disabled parsers.
* Ability to see number of titles in preview and in test parser logs.
* Environment variables ${/} and ${srmdir} that can be used even in steam directory, rom directory fields. 
### Changed 
* Removed retrogaming.cloud from list of image providers (it is defunct).
* Changed structure of AddedItemsV2.json to include Parser ID.
* Added lontanadascienza as a contributor.
### Fixed
* A bunch of dead links in Readme and About Markdown.

## 2.2.23
### Added 
* Improved documentation for custom variables based on advice of a friend.
### Fixed
* Fixed parsers deleting custom logo positions on re parsing (note they will still delete if that app's name changes - SRM will not yet relocate the old json file to the new name).
* Fixed downloading borders not showing in all artwork view.

## 2.2.22
### Added
* Added resolutions to images.
* Added an "All Artwork" view.
### Fixed
* Fixed pngs not replacing jpgs.
* Fixed state management (no more duplicate shortcuts).

## 2.2.21
### Added
* Got Logos working.
* Got Recent Images working.

## 2.2.19
### Changed
* Updated `steamgriddb` url.

## 2.2.18
### Changed
* `retrogaming.cloud` is now turned of by default for new users.
### Fixed
* Fixed [Issue 111](https://github.com/SteamGridDB/steam-rom-manager/issues/111).

## 2.2.17
### Added
* Added `${os:[win|mac|linux]|on match|no match(optional)}` variable. Can be used to select OS specific extensions and etc.

## 2.2.16
### Changed
* For existing entries, an union of parser categories and already existing categories will be used when saving `VDF` files. This will preserve any user added category.

## 2.2.15
### Changed
* Removed file restriction for `Executable` field. Any valid path can be used for executable.

## 2.2.14
### Fixed
* A bug introduced in `2.2.12` would modify `userSettings` schema. This allows user to save invalid configurations, but would throw an error when trying to load it.

## 2.2.13
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

## 2.2.12
### Removed
* ConsoleGrid support, because it's dead (again...).
### Added
* Configuration preset support has been added. User-made configurations can now be loaded from `configPresets.json` file. This file, together with `customVariables.json`, will be automatically downloaded from github **only** if they don't exist on user's computer. Downloads can be forced from **settings** page.
* Hosted files can be found [here](https://github.com/FrogTheFrog/steam-rom-manager/tree/master/files).

## 2.2.11
### Fixed
* Improved diacritic character handling for fuzzy matcher. For ex. `Pokémon Snap` should now be matched to `Pokemon Snap` with diacritic option enabled.
### Added
* More emulator examples (by **Chocobubba** and **Wesim**).

## 2.2.10
### Fixed
* `Shortcuts.vdf` file would not have elements properly removed. If you had app entry at index 0, followed by other apps, removing app at 0 would not re-index remaining entries. Thus, array element at 0 index would remain empty, forever. This, besides corrupting `vdf`, would result in "`exe` of undefined" error.
* Since the rewrite of `shortcuts.vdf` parser, you could not add Steam categories that were numbers (for ex. 7800, 123, 777, etc.). This is fixed now.

## 2.2.9
### Added
* Fuzzy matcher now has an option to replace diacritic characters to their latin equivalent. Available character list is probably not full, so if you find a missing character be sure to post an issue.
* Parser variable added which can replace diacritic characters to their latin equivalent.
* Added default/fallback image option for when there is no image available.
### Fixed
* `substr` error when glob contains space characters at the start of input.
* Could not add local image manually most of the time due tue file input being removed before callback is fired.

## 2.2.8
### Added
* Parser configuration can now be copied to clipboard in "ready-to-paste" text format.
### Changed 
* Completely rewritten `VDF manager` to ease implementation of new features. Should increase list saving performance. If something breaks, there's always a **backup** VDF!
* Optimized `shortcuts.vdf` parser. Should give a **huge** performance increase for people with a lot of entries.
* Default page changed from `Preview` to `Parsers`.
* Changed generic `vdf` library from [node-vdf](https://github.com/RJacksonm1/node-vdf) to [@node-steam/vdf](https://github.com/node-steam/vdf). Previous one did not properly convert data to `vdf`. This change **might** require to delete `screenshots.vdf` (only if SRM throws an error).

## 2.2.7
### Added
* Executable modifier field is now available. Now you can modify executable, append/prepend custom data.
### Changed 
* Arguments are now appended to executable by default.
* A lot of fields are now trimmed for whitespace.
### Fixed
* Added missing and fixed incorrect whitespace validation.

## 2.2.6
### Added
* Titles, not found in `customVariables.json` can now be failed (skipped). Useful for MAME and similar emulators.
### Fixed 
* Empty titles (with a length of a 0) will now be failed (skipped) by a parser.

## 2.2.5
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

## 2.2.4
### Fixed
* Users with configuration made in v2.0.0 could not migrate to older versions due to `Glob-regex` and `Glob-Regex` type mismatch.

## 2.2.3
### Fixed
* `regex` function variable would use substitution.
* Single line text input fields will now have newlines removed on paste.
### Changed
* Updated command line examples to use `${exeDir}`.

## 2.2.2
### Fixed
* `Glob-regex` would not accept `g` flag.

## 2.2.1
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

## 2.2.0
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
* Navigation panel can now be re-sized. Maximum allowed width is 25% of viewport width.
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

## 2.1.1
### Added
* CMD examples for Nestopia and Project64.
### Fixed
* Initial image size would remain at 40% if preview menu was opened without an already generated list.
* Image size would not save if user exists app in preview menu.

## 2.1.0
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

## 2.0.1
### Fixed
* Url retrieving would silently stop after 3 timeouts. Now they stop after 3 failures, not timeouts, as intended.

## 2.0.0
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

## 1.1.4
### Fixed
* `shortcuts.vdf` should now have recurring titles removed as intended. If you had titles disappear, it was because Steam changed `AppName` property to `appname`. That resulted in too many titles and Steam got confused. Simply re-adding all titles via SRM should fix it as it will delete duplicates.

## 1.1.3
### Added
* Greedy search option which will search for images using both `${title}` and `${fuzzyTitle}`
### Fixed
* Added a temporary fix, which should prevent `shortcuts.vdf` corruption

## 1.1.2
### Added
* Additional one time backups will be made with extension `.firstbackup`
### Changed
* Glob-regex now joins capture pairs. See [here](https://regex101.com/r/xasqq9/2) how it can be used
### Fixed
* Alert component now times out as intended (previously it would just stay there until user clicked it or it received a new message to display)

## 1.1.1
### Changed
- You won't be forced to shut down Steam anymore, but will be adviced to, everytime you generate a list

## 1.1.0
### Added
- Offline mode
### Changed
- In order to release binaries for multiple platforms, Steam check is done only on Windows
- User data is now located at: `%APPDATA%\steam-rom-manager\userData` (Windows) or `~/.config/steam-rom-manager/userData` (linux)

## 1.0.0
### Added
- Everything
