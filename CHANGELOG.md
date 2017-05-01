# Change Log
All notable changes to this project will be documented in this file.

## 1.1.2 - 2017-05-01
### Added
* Additional one time backups will be made with extension `.firstbackup`

### Changed
* Glob-regex now joins capture pairs. See [here](https://regex101.com/r/xasqq9/2) how it can be used
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
