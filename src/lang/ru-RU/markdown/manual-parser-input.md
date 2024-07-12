# Особые входные данные пользовательского анализатора

## Каталог манифестов `[Поддерживает переменные окружения]`{.noWrap}

Расположение json-файлов, которые вы хотите превратить в ярлыки steam. `Каталог манифестов`, как ожидается, будет иметь вид:

```
/path/to/manifests
--manifest1.json
--manifest2.json
--manifest3.json
...
```
Имена файлов не имеют значения. Важно то, что каждый файл `manifest.json` имеет одно название, например, так:
```json
{
    "title": "gameTitle",
    "target": "game/path/target.sh",
    "startIn": "game/path",
    "launchOptions": "--args",
    "appendArgsToExecutable": false
}
```
Или список названий, например, так:
```json
[
  {
    "title": "gameTitle",
    "target": "game/path/target.sh",
    "startIn": "game/path",
    "launchOptions": "--args".
    "appendArgsToExecutable": true
  },
  {
    "title": "gameTitle2",
    "target": "game2/path/target.sh",
    "startIn": "game2/path",
    "launchOptions": "--args2",
    "appendArgsToExecutable": false
  }
]
```

Типичным вариантом является использование одного json-файла для каждого типа игры, года и т. д.

Как и для анализаторов ROM, `appendArgsToExecutable` определяет, будут ли `launchOptions` добавлены к ярлыку `target` или появятся отдельно в виде опций запуска в steam.
