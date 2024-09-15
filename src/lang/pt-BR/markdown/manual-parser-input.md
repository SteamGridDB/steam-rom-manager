# Manual Parser specific inputs

## Diretório de Manifestos `[Suporta Variáveis de Ambiente]`{.noWrap}

A localização dos arquivos json que você quer transformar em atalhos Steam. `Diretório de Participantes` deve ser do formulário:

```
/path/to/manifests
--manifest1.json
--manifest2.json
--manifest3.json
...
```

Os nomes dos ficheiros não importam. O que importa é que cada arquivo de `manifest.json` seja ou um único título, assim:

```json
{
  "title": "gameTitle",
  "target": "game/path/target.sh",
  "startIn": "game/path",
  "launchOptions": "--args"
}
```

Ou uma lista de títulos, assim:

```json
[
  {
    "title": "gameTitle",
    "target": "game/path/targetet. h",
    "startIn": "game/path",
    "launchOptions": "--args"
  },
  {
    "title": "gameTitle2",
    "target": "game2/path/target. h",
    "startIn": "game2/path",
    "launchOptions": "--args2"
  }
]
```

Um caso típico de uso seria usar um único arquivo json por tipo de jogo, ou por ano, etc.
