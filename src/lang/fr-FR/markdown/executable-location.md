# Executable `[supports env variables]`

Chemin vers l'exécutable de l'émulateur. Can be a file or any valid system path.

## Pourquoi optionnel ?

In some cases you might want to run game from a some kind batch file which will also automatically run the emulator itself. If that is the case, then providing executable is unnecessary.

The final shortcut will just be `"${filePath}" --command-line-args`.

### So, how do I add files to Steam without default executable?

All files retrieved by a parser will be treated as executables instead.
