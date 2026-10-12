# Spezielle Glob Zeichen

## Wildcards: `*`, `?`, `[...]`{.noWrap}

- `*` -- entspricht **0** oder **mehr** Zeichen in einem **einzelnen** Pfadabschnitt;
- `?` -- entspricht genau **1** Zeichen;
- `[...]`{.noWrap} -- entspricht einer Reihe von Zeichen. Wenn das erste Zeichen in Klammern `!` oder `^` ist, dann entspricht es jedem einzelnen Zeichen nicht in dieser Reihe:
  - `[abc]`{.noWrap} -- entspricht `a`, `b` oder `c` Zeichen;
  - `[!abc]`{.noWrap} -- entspricht jedem Zeichen außer `a`, `b` oder `c`;
  - `[0-9]`{.noWrap} -- entspricht jedem einzelnen Zeichen zwischen `0` und `9` (alle Zahlen);
  - `[a-z]`{.noWrap} -- entspricht jedem einzelnen Zeichen zwischen `a` und `z`.

## Globstar: `**`

`**` entspricht **0** oder **mehr** Verzeichnissen und dessen Unterverzeichnissen für Treffer. Wenn Verzeichnisse **viele** viele Unterordner haben, kann es zu Performance Problemen kommen. Wenn möglich, benutze [Klammersets](#braced-sets).

## Erweiterte Glob Matcher: `!(...)`{.noWrap}, `?(...)`{.noWrap}, `+(...)`{.noWrap}, `*(...)`{.noWrap}, `@(...)`{.noWrap}

Erlaubt zu spezifizieren, wie mann Muster aus einfachen Zeichen und Wildcards nutzt. Mehr als ein Muster kann in `(...)`{.noWrap} und getrennt mit `|` angegeben werden.

- `!(...)`{.noWrap} -- entspricht allem **außer** einem der gegebenen Muster;
- `?(...)`{.noWrap} -- entspricht **keiner** oder **einer** Vorkommen des gegebenen Musters;
- `+(...)`{.noWrap} -- entspricht **einem** oder **mehreren** Vorkommnissen des gegebenen Musters;
- `*(...)`{.noWrap} -- entspricht **keinem** oder **mehr**Vorkommnissen des gegebenen Musters;
- `@(...)`{.noWrap} -- entspricht **einem** Vorkommnis des gegebenen Musters.

Gegeben sind diese Pfade:

1. `dir1/file.txt`;
1. `dir2/dir3/file.txt`;
1. `dir4/111222/file.txt`;
1. `DIR/abc/file.txt`;
1. `DIR/abcabc/file.txt`;
1. `123/aabbcc/file.txt`;

hier sind einige Beispiele von erweterten Glob Matchern:

| Glob Muster                          | Entspricht (Listennummern) |
|:------------------------------------ | --------------------------:|
| `@(dir[12]\|DIR)/**/*.txt`          |         `1`, `2`, `4`, `5` |
| `!(dir[12]\|DIR)/**/*.txt`          |                   `3`, `6` |
| `*/!(*bb*)/*.txt`                    |         `2`, `3`, `4`, `5` |
| `*/?(abc)/*.txt`                     |                        `4` |
| `*/+(abc)/*.txt`                     |                   `4`, `5` |
| `*([a-zA-Z])/*/*.txt`                |                   `4`, `5` |
| `*([a-zA-Z])?([0-9])/*/${title}.txt` |         `2`, `3`, `4`, `5` |
| `*([a-zA-Z])+([0-9])/*/${title}.txt` |              `2`, `3`, `6` |
| `*([a-zA-Z])*([0-9])/*/${title}.txt` |    `2`, `3`, `4`, `5`, `6` |

## Klammersets: `{...}`{.noWrap}

Ein Weg mehrere Glob Muster aus einem Set zu machen. Klammersets starten mit `{` und enden mit `}`, mit einer beliebigen Anzahl an Komma-getrennten Sektionen (Klammersets können geschachtelt werden). Zum Beispiel entspricht `C:/dir1/{dir2,dir3/dir4}/file.txt`:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/dir4/file.txt`

Klammersets haben auch weniger nützlichen Reihensyntax `{x..x}` bei dem `x` ein einzelnes Zeichen ist. Zum Beispiel entspricht `C:/dir1/dir{2..4}/file.txt`:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/file.txt`
- `C:/dir1/dir4/file.txt`

Klammersets werden expandiert **bevor** geparst wird, und können daher nützlich sein um verschiedene Unterordner oder[erweiterte Glob Matchers](#extended-glob-matchers) zu generieren. Zum Beispiel entspricht `C:/+(a|{b),c)}/file.txt`:

- `C:/+(a|b)/file.txt`
- `C:/+(a|c)/file.txt`
