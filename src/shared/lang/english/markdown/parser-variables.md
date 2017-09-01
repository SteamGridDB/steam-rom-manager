# Parser variables

Here are tables of variables that can be used with options that have `[supports variables]`{.noWrap} specified in their descriptions.

## Directory variables

|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${exeDir}`|Executable directory|
|`${romDir}`|ROMs directory|
|`${steamDir}`|Steam directory|
|`${startInDir}`|"StartIn" directory|
|`${fileDir}`|file's, returned by a parser, directory|

In case executable directory input is left **empty**, `${exeDir}`{.noWrap} is equal to `${fileDir}`{.noWrap}.

## Name variables

|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${exeName}`|Name of executable (without extension)|
|`${fileName}`|Name of file which was returned by a parser (without extension)|

In case executable directory input is left **empty**, `${exeName}`{.noWrap} is equal to `${fileName}`{.noWrap}.

## Extension variables

|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${exeExt}`|Extension of executable (with a dot)|
|`${fileExt}`|Extension of file which was returned by a parser (with a dot)|

In case executable directory input is left **empty**, `${exeExt}`{.noWrap} is equal to `${fileExt}`{.noWrap}.

## Path variables

|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${exePath}`|Full path to an executable|
|`${filePath}`|Full path to a file which was returned by a parser|

In case executable directory input is left **empty**, `${exePath}`{.noWrap} is equal to `${filePath}`{.noWrap}.

## Parser variables

|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${title}`|Extracted title|
|`${fuzzyTitle}`|Fuzzy matched title|
|`${finalTitle}`|Extracted title which was modified by title modifier|
|`${fuzzyFinalTitle}`|Fuzzy matched title which was modified by title modifier|

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap} and `${finalTitle}`{.noWrap} is equal to `${fuzzyFinalTitle}`{.noWrap}.

## Other variables

|Variable (case-insensitive)|Corresponding value|
|---:|:---|
|`${/}`|System specific directory separator: `\` or `/`|
