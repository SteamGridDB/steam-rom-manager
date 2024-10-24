# Default image `[supports variables]`{.noWrap}

Consente di utilizzare un'immagine memorizzata localmente, come immagine predefinita/di fallback. Una stringa [speciale di input glob](#special-glob-input) viene utilizzata per recuperare le immagini. Viene utilizzata solo la prima immagine recuperata.

Questa immagine verrà mostrata **solo** se non ci sono altre immagini disponibili. Se l'immagine Steam è disponibile, sarà possibile scegliere tra quella di Steam e questa immagine.

## Estensioni di file consentite

Solo le estensioni di file `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} e `TGA`{.noWrap} sono supportate. Anche se parser trova file con altre estensioni, non saranno inclusi nell'elenco finale.

## Posso spostare la cartella dell'immagine di default dopo aver salvato la lista delle app?

Sì, una volta salvata la lista, l'immagine predefinita viene copiata in una directory Steam dove viene rinominata per corrispondere all'APP ID di Steam.
