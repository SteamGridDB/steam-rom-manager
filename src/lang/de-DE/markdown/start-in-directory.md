# "Start In" directory (optional) `[supports environment variables]`{.noWrap}

Standardmäßig ist das Verzeichnis "Start in" auf das ausführbare Verzeichnis gesetzt:

![Standard "Start in" Verzeichnis](../../../assets/images/default-start-in-directory.png) {.fitImage.center}

Mit dieser Option können Sie jedes gewünschte Verzeichnis als "Start In" Verzeichnis festlegen:

![Ner "Start In" directory](../../../assets/images/new-start-in-directory.png) {.fitImage.center}

It is useful when you're using batch files to start emulator and a game, but emulator requires a specific "Start In" directory to work properly.

## Shortcut Passthrough
If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the directory of the target of that shortcut. In the future, it will be overridden with the start in directory of that shortcut.
