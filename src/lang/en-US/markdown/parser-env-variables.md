## Environment variables
These variables are pre parsed and can be used even in the Rom Directory, Steam Directory, Executable Location, and Start In Dir fields.
|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${/}`|System specific directory separator: `\` or `/`|
|`${srmdir}`|Directory of portable SRM executable|
|`${steamdirglobal}`|Global steam directory, specified in `Settings`|
|`${accountsglobal}`|Global user accounts, specified in `Settings`|
|`${romsdirglobal}`|Global ROMs directory, specified in `Settings`|
|`${retroarchpath}`|Path to Retroarch executable, specified in `Settings`|
|`${racores}`|Directory of retroarch cores, specified in `Settings`|
|`${localimagesdir}`|Directory of your local images, specified in `Settings`|


The utility of the environment variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.

Function variables can also be used in fields that permit environment variables (e.g. `${os:win|C:\path\to\startdir|${os:linux|/path/to/startdir}}`)
