# Benutzerkonten (Optional)

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

You can also set accounts accounts by specifying their ids directly:

```
${56489124}${21987424}
```

The account id is the name of the account directory that appears in `/path/to/steam/userdata`.
