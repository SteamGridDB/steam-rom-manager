# itch.io Parser Specific Inputs

## itch.io AppData Path Override
By default Steam ROM Manager assumes your itch.io app data is located at `%APPDATA%\itch` on windows `$HOME/.config/itch` on linux and `$HOME/Library/Application Support/itch` on macos.
This field allows you to override that path if your itch.io user data is elsewhere.

## itch.io Windows-on-Linux Install Drive Redirect
On Linux, Windows app locations are recorded with Windows paths, even if running via Proton/Wine. If set, this field replaces the root of game paths.
For example, this would change a `C:\\Path\To\Game.exe` to `<field value>/Path/To/Game.exe`.

This field only has an effect on Linux systems.
