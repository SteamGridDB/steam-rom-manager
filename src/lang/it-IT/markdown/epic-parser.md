# Epic Games Parser

This parser imports games from the [Epic Games Store](https://store.epicgames.com/en-US/) so that artwork can be chosen for them and they can be added into Steam.

If it doesn't work it is because Epic has altered the structure of their game manifests, in this case please let the developers of SRM know and we will resolve the issue.

In order for this parser to work with the open source Epic alternative [Legendary](https://github.com/derrod/legendary), [EGL sync must be enabled in Legendary](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748) (this creates the appropriate files for the parser to read, and does not require the `Epic Games Store` to be installed).

Detto questo, c'è anche un parser `Legendary` in SRM che funziona proprio direttamente.

## Compatibilità
Questo parser attualmente funziona solo su sistemi `Windows` e `Mac OS`. Su `Mac OS` non è possibile avviare da Epic Store, quindi il toggle dovrebbe rimanere disabilitato.
