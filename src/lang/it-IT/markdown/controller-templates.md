# Template per Controller
I template per i controller ti consentono di configurare il layout dei pulsanti per controller e per parser.

Potresti voler disabilitare la `Sincronizzazione Cloud` in Steam per evitare che le tue configurazioni del controller SRM assegnate vengano sovrascritte. <br>Puoi trovare l'impostazione sotto `Steam > Impostazioni > Cloud`.

Per creare un template personalizzato:
* Apri Steam.
* Collega il controller per cui vuoi configurare il template.
* Fai clic col tasto destro del mouse su un qualsiasi gioco e premi `Gestisci > Layout del Controller`.
* Configura i pulsanti come preferisci.
* Clicca `Esporta Configurazione` po `Salva nuovo template di associazione`.
* Chiama il template nella forma: `Titolo Template (SRM)`. Devi terminare il nome con `(SRM)` o SRM non riconoscerà il template.
* Ripeti per ogni tipo di controller diverso che desideri configurare.

Nel parser SRM:
* Premi `Re-Fetch Controller Templates` per ottenere i template per ogni i tipo di controller da Steam. Questo cancellerà il template attualmente selezionato se non è uno dei template disponibili in Steam.

Attualmente, SRM estrae tutti i template predefiniti (fatti da Valve) per ogni controller e tutti i template definiti dall'utente che terminano in `(SRM)`.

* Seleziona il tuo template e salva il parser. The controller configsets will be applied once you hit `Save to Steam` in the Add Games.

* Per reimpostare la configurazione del controller, puoi `Rimuovere tutte le Inserzioni aggiunte all'App` dalle impostazioni globali (questo elimina tutti i cambiamenti fatti da SRM dai tuoi dati di steam) o premere `Unset All Controllers` nel parser (questo rimuove solo le impostazioni del controller per la cartella di steam e specificata dall'utente in quel parser).

Once this is done you can parse and add games to steam as usual, and the templates will be applied to all the titles in the parser.


