# Che cos’è l’APP ID di Steam?

Steam utilizza l'APP ID per identificare i giochi. Per i giochi non di Steam vengono generati utilizzando:

- Eseguibile;
- Titolo finale dell'app.

Se usi `RetroArch` o emulatori simili per aggiungere lo stesso gioco, ma su console diverse, si incontra un problema in cui solo **un titolo** viene aggiunto e altri semplicemente scompariranno. Questo è dovuto ad APP ID duplicati.

## Aggiungere titoli identici per console diverse

L'APP ID di Steam non deve essere identico. Questo può essere ottenuto cambiando il valore **Modificatore Titolo** o abilitando **Aggiungi argomenti all'eseguibile**. La seconda opzione aggiunge una terza variabile all'APP ID:

- Eseguibile;
- Titolo finale dell'app;
- Argomenti riga di comando.

La maggior parte delle volte la linea di comando conterrà un percorso unico al gioco che dovrebbe permettere di generare APP ID univoci.
