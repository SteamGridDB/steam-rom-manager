# "Start In" directory (optional) `[supports environment variables]`{.noWrap}

By default "Start In" directory is set to executable's directory:

![Default "Start In" directory](../../../assets/images/default-start-in-directory.png) {.fitImage .center}

This option allows you to specify any directory you want as a "Start In" directory:

![Ner "Start In" directory](../../../assets/images/new-start-in-directory.png) {.fitImage .center}

It is useful when you're using batch files to start emulator and a game, but emulator requires a specific "Start In" directory to work properly.

## Shortcut Passthrough
If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the directory of the target of that shortcut. In the future, it will be overridden with the start in directory of that shortcut.


## Environment variables
These variables are pre parsed and can be used even in the Rom Directory, Steam Directory, Executable Location, and Start In Dir fields.
|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${/}`|System specific directory separator: `\` or `/`|
|`${srmdir}`|Directory of portable SRM executable|

The use of the variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.
