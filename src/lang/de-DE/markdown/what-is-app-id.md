# Was ist die Steams APP-ID?

Steam verwendet die APP-ID, um Spiele zu identifizieren. Für Nicht-Steam-Spiele werden diese mit folgenden Elementen generiert:

- Ausführbare Datei;
- Finaler App-Titel.

Wenn du `RetroArch` oder ähnliche Emulatoren benutzt, um das gleiche Spiel auf verschiedenen Konsolen hinzuzufügen, wirst du auf ein Problem stoßen, bei dem nur **ein** Titel hinzugefügt und der Rest verschwinden wird. Das liegt an duplizierten APP-IDs.

## Hinzufügen identischer Titel von verschiedenen Konsolen

Die Steam-APP-ID darf nicht identisch sein. Dies kann erreicht werden, indem du den **Titel ändern ** Wert anpasst oder **Argumente an ausführbaren Datei anhängen** aktivierst. Die zweite Option fügt eine dritte Variable zur APP-ID hinzu:

- Ausführbare Datei;
- Finaler App-Titel;
- Kommandozeilen-Argumente.

Die meiste Zeit wird die Kommandozeile einen eindeutigen Spielpfad enthalten, der es erlauben sollte, eindeutige APP-IDs zu generieren.
