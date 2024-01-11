# Analizzatore di Epic Games

Questo parser importa giochi dall' [Epic Games Store](https://store.epicgames.com/en-US/) app, così che gli artwork possano essere scelti per loro ed essere aggiunti a Steam.

Se cioò non funziona è perche Epic ha modificato la struttura dei loro manifest giochi, in tal caso si prega di avvisare gli sviluppatori di SRM cosicché risolvano il problema.

Affinché questo parse funzioni con l'alternativa open source ad Epic [Legendary](https://github.com/derrod/legendary), [la sincronizzazione EGL deve essere abilitata in Legendary](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748) (ciò crea i file appropriati per l'analisi del parser, e non richiede che l'`Epic Games Store` sia installato).

Detto questo, c'è anche un parser `Legendary` in SRM che funziona proprio direttamente.

## Compatibilità
Questo parser attualmente funziona solo su sistemi `Windows` e `Mac OS`. Su `Mac OS` non è possibile avviare da Epic Store, quindi il toggle dovrebbe rimanere disabilitato.
