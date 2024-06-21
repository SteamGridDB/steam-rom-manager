# User Exceptions
## What not to use this for
This tool can be used to define per app exceptions that over rule the parsers. It should not be used to accomplish bulk tasks. For example, removing the colon character from titles can be accomplished via the title modifier `${/:/|${title}|}` and should not be done here. If a command line argument is common to every parsed app, then use the command line argument field - do not create a bunch of entries here! 

## Extracted Title - *Mandatory*
The only mandatory exception field is `Extracted Title`. Once this is specified and the exception is saved, any game that matches will have its fields overridden by any non-blank exception fields (if left blank, the exception fields do nothing).

The `Extracted Title` field matches in two ways:

* Based on the `Exception ID` (found by running test parser). For example if the game were `Portal 1` and its `Exception ID` was `12345` then you might put `Portal 1 ${id:12345}`. If the `Exception ID` is present then it doesn't matter what label you put in front of it, but for readability and searchability it's nice to put the game's actual name in front of the `Exception ID`.
* Based on the `Extracted Title` (found by running test parser). For example if the `Extracted Title` were `Portal 2` you would put `Portal 2`.

Thus you can either have an exception that applies to all games with the same name or an exception that applies only to an exact game (`Exception ID`s are unique). The reason for this is primarily backwards compatibility -- SRM formerly matched only on the `Extracted Title`.

Exceptions generated from `Add Games` will always be in the form `Extracted Title ${id:XXXXXX}`.

## New Display Title

This is the title that will display in Steam. It will not be used to search for images.

## New Search Title

This is the title that will be used to search for images on [SteamGridDB](https://www.steamgriddb.com). There are two options for overriding it:

* Specify the new search title as whatever text you want.
* Specify the exact game id to pull images from. For example to get images for the game [Flow](https://www.steamgriddb.com/game/5254019) which has SteamGridDB url `https://www.steamgriddb.com/game/5254019` you would put `${gameid:5254019}`.

## New Commandline Args

Custom commandline arguments like `--fullscreen`, etc, that can be applied to a specific title. These only override the arguments field of the Steam shortcut and are never appended to the executable.

## Exclude Title

The ability to exclude individual titles from being added to Steam. This allows you to keep titles that you don't want in Steam in the same folder as the rest of your games. 

## Local Artwork Only

Don't fetch artwork from remote providers (e.g. [steamgriddb](https://www.steamgriddb.com)). Useful when SGDB is incorrectly matching the game or you just don't like any of the artwork available for it.

## Custom Variables
The task of overriding specific titles can also be accomplished by manually editing the custom variables JSON file and using appropriate variables in the `Title Modifier` parser field. It is recommended, however, that you use this tool instead since the custom variables JSON file will be updated over time and your edits may be overwritten.
