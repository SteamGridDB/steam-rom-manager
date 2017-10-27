# Change Log
All notable changes to this project will be documented in this file.

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
