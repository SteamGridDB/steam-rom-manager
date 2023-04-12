# Steam-Parser

Dieser Parser importiert Steam Spiele in SRM. Er fügt keine Verknüpfungen hinzu, aber erlaubt dir, das Artwork für deine Steam Spiele festzulegen. Standardmäßig holt der Parser Spiele von allen Benutzerkonten im angegebenen Verzeichnis &mdash;. Wenn du es vorziehst, nur die Spiele für eine Teilmenge der Konten zu erhalten, gib diese im Feld `Benutzerkonten` an.

## Einschränkungen
Leider funktioniert dieser Parser vorerst nur für Steam Spiele, ** die in mindestens einer Kategorie** sind. Der Grund dafür ist, dass Steam deine vollständige Liste der Spiele nur lokal speichert, wenn diese kategorisiert sind. Manchmal werden aus unbekannten Gründen Spiele auch ohne Kategorie lokal gespeichert und der Parser funktioniert, aber um sicher zu sein ist es am einfachsten, **eine Steam Kategorie zu erstellen**, die alle deine Steam Spiele enthält.

## Benutzerkonten (Optional)

Can be used to limit configuration to specific user accounts. In order to set user accounts, the following syntax must be used:
```
${...}
```
You **must** use the username you use to **log in** into Steam **if** [use account credentials](#what-does-use-account-credentials-do) is enabled:

![Account example](../../../assets/images/user-account-example.png) {.fitImage.center}

For example, this is how you specify account for "Banana" and "Apple":

```
${Banana}${Apple}
```

In case the [use account credentials](#what-does-use-account-credentials-do) is disabled, you can still limit accounts by specifying their ids directly:

```
${56489124}${21987424}
```

## What does "Skip found accounts with missing data directories" do?

Sometimes Steam's file that contains logins, may contain users that do not have data directory created (might have been manually deleted, etc.). You can specify to skip those accounts by enabling this option.

## What does "Use account credentials" do?

Tries to look for account credentials in Steam directory. In other words -- username. Username then can be used to filter accounts without actually having to know their ids.

### Warning!

If Steam has credential saving disabled, this option will prevent finding user accounts.
