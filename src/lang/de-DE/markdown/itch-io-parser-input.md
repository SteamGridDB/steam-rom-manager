# itch.io Parser specific inputs

## itch.io AppData Path Override
Standardmäßig geht der Steam ROM Manager davon aus, dass sich deine itch.io App-Daten in Windows auf `%APPDATA%\itch`, in Linux auf `$HOME/.config/itch` und in macOS auf `$HOME/Library/Application Support/itch` befinden. Dieses Feld erlaubt dir, diesen Pfad zu überschreiben, wenn deine itch.io Benutzerdaten woanders gespeichert sind.

## itch.io Windows-on-Linux Install Drive Redirect
On Linux, Windows app locations are recorded with Windows paths, even if running via Proton/Wine. If set, this field replaces the root of game paths. For example, this would change a `C:\\Path\To\Game.exe` to `<field value>\Path\To\Game.exe`.

Dieses Feld hat nur Auswirkungen auf Linux-Systeme.
