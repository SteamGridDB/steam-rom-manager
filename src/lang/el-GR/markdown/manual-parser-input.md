# Manual Parser Specific Inputs

## Manifests Directory `[Supports Environment Variables]`{.noWrap}

The location of the json files you want to turn into steam shortcuts. `Manifests Directory` is expected to be of the form:

```
/path/to/manifests
--manifest1.json
--manifest2.json
--manifest3.json
...
```
The names of the files do not matter. What does matter is that each `manifest.json` file is either a single title, like so:
```json
{
    "title": "gameTitle",
    "target": "game/path/target.sh",
    "startIn": "game/path",
    "launchOptions": "--args",
    "appendArgsToExecutable": false
}
```
Or a list of titles, like so:
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

A typical use case would be to use a single json file per game type, or per year, etc.

Just like for ROM parsers, `appendArgsToExecutable` determines whether `launchOptions` are appended to the shortcut `target` or appear separately as launch options in steam.
