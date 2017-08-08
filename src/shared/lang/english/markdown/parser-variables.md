# Parser variables

Here is a table of variables that can be used with options that have `[supports variables]`{.noWrap} specified in their descriptions.

|Variable (case-insensitive)|Corresponding values|
|---:|:---|
|`${dir}`|ROMs directory|
|`${title}`|extracted title|
|`${fuzzyTitle}`|fuzzy matched title|
|`${finalTitle}`|extracted title which was modified by title modifier|
|`${fuzzyFinalTitle}`|fuzzy matched title which was modified by title modifier|
|`${file}`|filename of a file returned by a parser|
|`${filePath}`|full path to a file returned by a parser|
|`${sep}`|system specific directory separator: `\` or `/`|

In case fuzzy matching fails or is disabled, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.
