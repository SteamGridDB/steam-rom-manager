# Steam-Parser

This parser imports steam games into SRM so you can manage their artwork. It does not add shortcuts, and as such is an `Artwork Only` parser. This parser requires the `User Accounts` field to be set.

## Einschränkungen
Leider funktioniert dieser Parser vorerst nur für Steam Spiele, die in **mindestens einer Kategorie** sind. Der Grund dafür ist, dass Steam die vollständige Liste deiner Spiele nur lokal speichert, wenn diese kategorisiert sind. Manchmal werden aus unbekannten Gründen Spiele auch ohne Kategorie lokal gespeichert und der Parser funktioniert, aber um sicher zu sein ist es am einfachsten, **eine Steam Kategorie zu erstellen**, die alle deine Steam Spiele enthält.

## Benutzerkonten (erforderlich)

Used to limit configuration to specific user accounts. Um Benutzerkonten festzulegen, muss folgende Syntax verwendet werden:
```
${...}
```
Es **müssen** die Benutzernamen verwendet werden, die zum **Einloggen** in Steam verwendet werden, **falls** [Anmeldeinformationen verwenden](#what-does-use-account-credentials-do) aktiviert wurde:

![Konto-Beispiel](../../../assets/images/user-account-example.png) {.fitImage.center}

So kannst du zum Beispiel Konten für "Banana" und "Apple" festlegen:

```
${Banana}${Apple}
```

You can also limit accounts by specifying their ids directly. Zum Beispiel:

```
${56489124}${21987424}
```
Would limit the search to `steam/userdata/56489124` and `steam/userdata/21987424`.

## Was macht "Überspringe gefundene Konten mit fehlenden Datenverzeichnissen"?

Manchmal enthält die Steam-Datei, die Logins enthält, möglicherweise Benutzer, die kein Datenverzeichnis erstellt haben (könnte manuell gelöscht worden sein, etc.). Wenn diese Option aktiviert wird, werden solche Konten übersprungen.

## Was macht "Anmeldeinformationen verwenden"?

Versucht, nach Zugangsdaten im Steam-Verzeichnis zu suchen. Mit anderen Worten -- Benutzernamen. Der Benutzername kann dann verwendet werden, um Konten zu filtern, ohne deren ID zu kennen.

### Achtung!

Wenn in Steam das Speichern von Anmeldeinformationen deaktiviert ist, verhindert diese Option das Finden von Benutzerkonten.
