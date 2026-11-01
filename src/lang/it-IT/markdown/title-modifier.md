# Modificatore del titolo `[supporta le variabili]`{.noWrap}

Defaults to `${fuzzyTitle}`{.noWrap} if field is unset. This setting can be used to prepend or append desired characters to a Steam shortcut's `Title`. Ad esempio, dato che `${fuzzyTitle}`{.noWrap} è `Zelda 2`, puoi aggiungere `(1.7.5)` ad esso impostando valore a:

```
${fuzzyTitle} (1.7.5)
```

Puoi usare `${title}`{.noWrap} o qualsiasi altra variabile per costruire il titolo finale.

Questa impostazione influenza l'APP ID di Steam.
