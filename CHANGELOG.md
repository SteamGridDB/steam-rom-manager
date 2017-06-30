# Change Log
All notable changes to this project will be documented in this file.

## 2.1.0 - 2017-0X-XX
### Added
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

### Fixed
* `Observable` settings load logic bug.
* Url encoding bug (issue #27).

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
* Prefered image list is removed as it is impossible to implement with background image downloader.
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
