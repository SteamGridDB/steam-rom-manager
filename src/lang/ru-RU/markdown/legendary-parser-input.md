# Особые входные данные Legendary анализатора

## Legendary Path Override

By default Steam ROM Manager uses `(Get-Command legendary).Path` on Windows and `which legendary` on Linux and Mac to determine the location of your Legendary executable. This field allows you to override that path.

Specifying the correct location of the Legendary executable is only necessary if you enable launch via Legendary (see below), as otherwise SRM has no need of the location of Legendary's executable.

## Легендарный `installed.json` Переопределение пути

Большинству пользователей это не нужно, так как они используют стандартную установку `Legendary`, где манифест установленных игр будет находиться по адресу `~/.config/legendary/installed.json`.

Если же по какой-то причине манифест установленной игры находится в нетипичном месте, вы можете указать правильный путь к манифесту здесь.

## Launch via Legendary `[Recommend enabled]`

What it sounds like, this toggle determines whether games launch via Legendary or directly. Launching via Legendary provides access to Epic's online services.
