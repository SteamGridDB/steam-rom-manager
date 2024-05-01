# UWP Parser Specific Inputs

## Games directory

UWP apps are supposed to say if they are games or apps, and this is not always correct. To remediate this, it's useful to say where you're installing your games to only scan for those UWP apps. Defaults to `C:\XboxGames`.

Set it to `C:\Program Files\WindowsApps` to grab all UWP applications -- you'll have to remove unwanted ones by hand.

## Launch as UWP or from GameLaunchHelper.exe

Gamepass games can be launched both ways, although UWP is preferred.
