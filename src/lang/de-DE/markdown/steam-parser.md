# Steam-Parser

Dieser Parser importiert Steam Spiele in SRM. Er fügt keine Verknüpfungen hinzu, aber erlaubt dir, das Artwork für deine Steam Spiele festzulegen. Standardmäßig holt der Parser Spiele von allen Benutzerkonten im angegebenen Verzeichnis &mdash;. Wenn du es vorziehst, nur die Spiele für eine Teilmenge der Konten zu erhalten, gib diese im Feld `Benutzerkonten` an.

## Einschränkungen

Leider funktioniert dieser Parser vorerst nur für Steam Spiele, ** die in mindestens einer Kategorie** sind. Der Grund dafür ist, dass Steam deine vollständige Liste der Spiele nur lokal speichert, wenn diese kategorisiert sind. Manchmal werden aus unbekannten Gründen Spiele auch ohne Kategorie lokal gespeichert und der Parser funktioniert, aber um sicher zu sein ist es am einfachsten, **eine Steam Kategorie zu erstellen**, die alle deine Steam Spiele enthält.

## Benutzerkonten (Optional)

Kann verwendet werden, um die Konfiguration auf bestimmte Benutzerkonten zu beschränken. Um Benutzerkonten festzulegen, muss folgende Syntax verwendet werden:

```
${...}
```

Es **müssen** die Benutzernamen verwendet werden, die zum **Einloggen** in Steam verwendet werden, **falls** [Anmeldeinformationen verwenden](#what-does-use-account-credentials-do) aktiviert wurde:

![Konto-Beispiel](../../../assets/images/user-account-example.png) {.fitImage.center}

So können Sie zum Beispiel das Konto für "Banana" und "Apple" festlegen:

```
${Banana}${Apple}
```

Für den Fall, dass [Anmeldeinformationen verwenden](#what-does-use-account-credentials-do) deaktiviert wurde, können Benutzerkonten immer noch anhand ihrer ID limitiert werden:

```
${56489124}${21987424}
```

## Was macht "Überspringe gefundene Konten mit fehlenden Datenverzeichnisse"?

Manchmal enthält die Steam-Datei, die Logins enthält, möglicherweise Benutzer, die kein Datenverzeichnis erstellt haben (könnte manuell gelöscht worden sein, etc.). Wenn diese Option aktiviert wird, werden solche Konten übersprungen.

## Was macht "Anmeldeinformationen verwenden"?

Versucht, nach Zugangsdaten im Steam-Verzeichnis zu suchen. Mit anderen Worten -- Benutzernamen. Der Benutzername kann dann verwendet werden, um Konten zu filtern, ohne deren ID zu kennen.

### Achtung!

Wenn in Steam das Speichern von Anmeldeinformationen deaktiviert ist, verhindert diese Option das Finden von Benutzerkonten.
