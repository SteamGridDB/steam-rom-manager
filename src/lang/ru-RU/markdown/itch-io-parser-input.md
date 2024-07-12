# Особые входные данные анализатора itch.io

## Переопределение пути AppData с itch.io
По умолчанию Steam ROM Manager предполагает, что данные вашего приложения itch.io находятся по адресу `%APPDATA%\itch` на windows `$HOME/.config/itch` на linux и `$HOME/Library/Application Support/itch` на macos. Это поле позволяет вам изменить этот путь, если данные пользователя itch.io находятся в другом месте.

## itch.io Перенаправление установочного диска Windows на Linux
В Linux местоположение приложений Windows записывается с путями Windows, даже если они запущены через Proton/Wine. Если установлено, это поле заменяет корень игровых путей. Например, это изменит `C:\\Path\To\Game.exe` на `<field value>/Path/To/Game.exe`.

Это поле имеет значение только для систем Linux.
