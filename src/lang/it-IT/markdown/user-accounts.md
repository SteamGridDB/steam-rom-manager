# Account utente (facoltativo)

Questo campo è utilizzato per limitare gli effetti di SRM a specifici account utente, e prende i valori nella forma:

`${XXX}${YYY}`

Questo limiterà gli effetti di SRM agli account `XXX` e `YYY` (è possibile specificare quanti account preferisci). Qui `XXX` e `YYY` stanno per:

* Un `Account ID` (il numero che appare come il nome della cartella del tuo account in `/path/to/steam/userdata/`). Ad esempio, dovresti specificare la cartella dell'account `userdata/56489124` come `${56489124}`.

* Uno `Steam Username` (il nome utente che usi per accedere a Steam). Ad esempio, dovresti specificare gli utenti `Banana` e `Apple` come `${Banana}${Apple}`.

Puoi mescolare e abbinare: `${56489124}${Apple}` va bene.

Puoi anche impostare questo campo utilizzando la variabile di ambiente `Account Globale` trovata nelle impostazioni via `${${accountsglobal}}`.

## Attenzione

Se hai `Non salvare le credenziali dell'account su questo computer` impostato in Steam, non c'è modo per SRM di conoscere il tuo `Steam Username` e **puoi solo usare** `Account IDs`. Se si desidera utilizzare `Steam Usernames` qui, vai su `Steam > Impostazioni > Account` e disabilita `Non salvare le credenziali dell'account su questo computer`, poi riavviare sia Steam chee SRM.
