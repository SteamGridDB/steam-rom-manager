# Steam directory `[supports environment variables]`{.noWrap}

Must be a valid Steam directory which contains Steam executable. In order for Steam account to be detected, user must have logged in at least once.

## How do I limit edited Steam accounts?

Enable **Show advanced options** and check **User accounts** option.

## Environment variables
These variables are pre parsed and can be used even in the Rom Directory, Steam Directory, Executable Location, and Start In Dir fields.
|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${/}`|System specific directory separator: `\` or `/`|
|`${srmdir}`|Directory of portable SRM executable|

The use of the variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.
