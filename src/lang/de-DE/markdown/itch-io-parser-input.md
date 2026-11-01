# itch.io Parser Specific Inputs

## itch.io AppData Pfad überschreiben
Standardmäßig geht der Steam ROM Manager davon aus, dass sich deine itch.io App-Daten in Windows auf `%APPDATA%\itch`, in Linux auf `$HOME/.config/itch` und in macOS auf `$HOME/Library/Application Support/itch` befinden. Dieses Feld erlaubt dir, diesen Pfad zu überschreiben, wenn deine itch.io Benutzerdaten woanders gespeichert sind.

## itch.io Windows-on-Linux Installations Laufwerk ändern
Unter Linux werden Windows-App-Standorte mit Windows-Pfaden aufgezeichnet, auch wenn sie über Proton/Wine laufen. Falls gesetzt, ersetzt dieses Feld das Stammverzeichnis der Spiele. Dies würde zum Beispiel einen `C:\Pfad\To\Game.exe` zu `<field value>/Path/To/Game.exe` ändern.

Dieses Feld hat nur Auswirkungen auf Linux-Systemen.
