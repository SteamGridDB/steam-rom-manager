# Executable (optional)

Path to emulator's executable. Can be a file or any valid system path.

## Why optional?

In some cases you might want to run game from a some kind batch file which will also automatically run the emulator itself. If that is the case, then providing executable is unnecessary.

### So, how do I add files to Steam without default executable?

All files retrieved by a parser will be treated as executables instead.

## Environment variables
These variables are pre parsed and can be used even in the Rom Directory, Steam Directory, Executable Location, and Start In Dir fields.
|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${/}`|System specific directory separator: `\` or `/`|
|`${srmdir}`|Directory of portable SRM executable|

The use of the variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.
