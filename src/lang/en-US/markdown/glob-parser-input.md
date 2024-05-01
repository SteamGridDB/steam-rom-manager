# Glob Parser Specific Inputs

## User's glob

This is where you create your glob for extracting title from file path. Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob. 

## How does it work?

In addition to special glob characters, glob parser requires you to enter `${title}`{.noWrap} variable. Parser will locate it's position inside your  **glob**, for example:

|User's glob|Position|
|---|---|
|`${title}/*/*.txt`|First level from the left|
|`{*,*/*}/${title}.txt`|First level from the right|
|`**/${title}/*.txt`|Second level from the right|

After acquiring `${title}`{.noWrap} position, `${title}`{.noWrap} will be replaced with a wildcard `*`.

## Limitations

Position extraction comes with some limitations -- glob is invalid if position can not be extracted. Most of the time you will be warned about what you can't do, however, if you find a combination that is allowed, but produces incorrect titles please make an issue at [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
