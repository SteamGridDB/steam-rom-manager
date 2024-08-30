# "Start In" directory (optional) `[supports environment variables]`{.noWrap}

By default "Start In" directory is set to executable's directory:

![Default "Start In" directory](../../../assets/images/default-start-in-directory.png) {.fitImage.center}

This option allows you to specify any directory you want as a "Start In" directory:

![Ner "Start In" directory](../../../assets/images/new-start-in-directory.png) {.fitImage.center}

It is useful when you're using batch files to start emulator and a game, but emulator requires a specific "Start In" directory to work properly.

## Shortcut Passthrough

If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the directory of the target of that shortcut. In the future, it will be overridden with the start in directory of that shortcut.
