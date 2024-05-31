## Impostazioni Generali
### Modalità offline `[Disabilitazione Consigliata]`

Quando è abilitato, SRM non effettua richieste di rete, utile se si desidera utilizzare SRM solo per le immagini locali.
### Cancella automaticamente il log prima di testare i parser `[Abilitazione Consigliata]`
Quando è abilitato, il log viene cancellato ogni volta che viene testato un parser.
### Mostra le attuali immagini di Steam di default `[Abilitazione Consigliata]`
Quando abilitata, questa impostazione dice a SRM di preimpostare ad un qualsiasi artwork attualmente presente in Steam per una data app. Se è disabilitato, ogni volta che SRM viene eseguito (e salvato) tutti gli artwork verranno resettati.
### Rimuovi le scorciatoie per i parser disabilitati `[Disabilitazione Consigliata]`
Quando abilitato, la disabilitazione di un parser e l'esecuzione di SRM rimuoverà tutte le voci aggiunte e gli artwork aggiunti per il parser disabilitato. Utile se vuoi che la tua libreria di Steam sia in corrispondenza 1-1 con i parser abilitati.

## Impostazioni Matcher Fuzzy
### Log risultati corrispondenti `[Disabilitazione Consigliata]`
Quando abilitato, appaiono log più verbosi per il matcher del titolo fuzzy nel `Log Eventi `. Utile per il debug di incorrette corrispondenze fuzzy.

### Reset elenco fuzzy
Reimposta l'elenco memorizzato di titoli usati per la corrispondenza fuzzy alla lista di titoli restituiti da `SteamGridDB` (rimuove qualsiasi titolo aggiunto dall'utente).
### Reset cache fuzzy
Pulisce la cache dei titoli che il matcher fuzzy ha già visto (prova se le modifiche apportate alla lista fuzzy non comportano modifiche ai titoli in SRM).

## Impostazioni del provider immagini
### Precarica le immagini recuperate `[Disabilitazione Consigliata]`
Quando abilitata, SRM otterrà tutti gli artwork disponibili per ogni gioco, piuttosto che scaricare solo un artwork alla volta mentre l'utente scorre tra le immagini. Non abilitare questa opzione a meno che tu non abbia una buona ragione e una piccolissima libreria di giochi, altrimenti potrebbe dar luogo a richieste di rete molto grandi (lente).
### Abilita provider
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.

## Variabili comunitarie e Preset
### Forza il download di variabili personalizzate.
Reimposta il file JSON delle variabili personalizzate che è usato per alcuni preset a qualunque stato corrente si trovi sul github di SRM. Utile se il file JSON delle variabili personalizzate è stato corrotto.
### Forza il download di preset personalizzati.
Reimposta i file JSON per i preset di parser a qualsiasi cosa si trovi sul github di SRM. Utile se la tua lista di preset non si aggiorna automaticamente per qualche motivo, o è diventata corrotta.
