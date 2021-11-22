# User Exceptions
## What not to use this for
This tool can be used to define per app exceptions that over rule the parsers. It should not be used to accomplish bulk tasks. For example, removing the colon character from titles can be accomplished via the title modifier `${/:/|${title}|}` and should not be done here. If a command line argument is common to every parsed app, then use the command line argument field - do not create a bunch of entries here! 

## How it works
The only mandatory field here is `extractedTitle to override`. Once this is specified and the exception is saved, any `extractedTitle` that matches `extractedTitle to override` will have its fields overridden by any non-blank exception fields (if left blank, the exception fields do nothing). You may also opt to exclude specific titles.

If you aren't sure what the `extractedTitle` is for a given game, check the output of testing the parser that game is in.

## Search Title

There are two options for overriding the title that is used to get images from SteamGridDB:

* Specify the new search title.
* Specify the exact game id to pull images from. For example to get images for the game [Flow](https://www.steamgriddb.com/game/5254019) which has SteamGridDB url `https://www.steamgriddb.com/game/5254019` you would put `${gameid:5254019}`.

## Custom Variables
The task of overriding specific titles can also be accomplished by manually editing the custom variables JSON file and using appropriate variables in the `Title Modifier` parser field. It is recommended, however, that you use this tool instead since the custom variables JSON file will be updated over time and your edits may be overwritten.
