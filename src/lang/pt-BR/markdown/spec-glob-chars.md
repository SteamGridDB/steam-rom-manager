# Caracteres especiais

## Caracteres: `*`, `?`, `[...]`{.noWrap}

- `*` -- corresponde a **0** ou **mais** caracteres em uma **única** porção de caminho;
- `?` -- corresponde exatamente a **1** caractere;
- `[...]`{.noWrap} -- corresponde a uma variedade de caracteres. Se o primeiro caractere entre colchetes é `!` ou `^` então corresponde a qualquer caractere que não esteja no intervalo:
  - `[abc]`{.noWrap} -- corresponde a `caracteres`, ``ou`c` e;
  - `[!abc]`{.noWrap} -- corresponde a qualquer caractere exceto por `um`, `b` ou `c`;
  - `[0-9]`{.noWrap} -- corresponde a qualquer caractere entre `0` e `9` caracteres (todos os números);
  - `[a-z]`{.noWrap} -- corresponde a qualquer caractere entre `um` e `z` caracteres (minúsculos em alfabeto).

## Globstar: `**`

`**` corresponde a **0** ou **mais** diretórios e subdiretórios procurando por partidas. Se os diretórios têm um **monte** de subdiretórios, isso vai causar problemas de desempenho. Se possível, use [conjuntos empacotados](#braced-sets).

## Partidas glob estendidas: `!(...)`{.noWrap}, `?(...)`{.noWrap}, `+(..)`{.noWrap}, `*(...)`{.noWrap}, `@(...)`{.noWrap}

Ele permite especificar como usar padrões feitos a partir de caracteres simples e caracteres curinga. Mais de um padrão pode ser especificado dentro de `(...)`{.noWrap} e separado com `'y`.

- `!(...)`{.noWrap} -- corresponde a qualquer coisa **exceto** um do(s) padrão(is);
- `?(...)`{.noWrap} -- corresponde a **zero** ou **um** ocorrência do(s) padrão(is);
- `?(...)`{.noWrap} -- corresponde a **zero** ou **um** ocorrência do(s) padrão(is);
- `?(...)`{.noWrap} -- corresponde a **zero** ou **um** ocorrência do(s) padrão(is);
- `!(...)`{.noWrap} -- corresponde a qualquer coisa **exceto** um do(s) padrão(is).

Dados esses caminhos de arquivos:

1. `dir1/file.txt`;
1. `dir2/dir3/file.txt`;
1. `dir1/file.txt`;
1. `Dir1/file.txt`;
1. `Dir1/file.txt`;
1. `dir1/file.txt`;

aqui estão alguns exemplos de "glob matchers" extendidos em ação:

| Padrões de flor                      | Correspondências (números da lista) |
| :----------------------------------- | ----------------------------------: |
| `@(dir[12]\|DIR)/**/*.txt`           |                `>`, `<`, `>=`, `=<` |
| `!(dir[12]\|DIR)/**/*.txt`           |                        `302`, `307` |
| `*/!(*bb*)/*.txt`                    |                `>`, `<`, `>=`, `=<` |
| `*/?(bb*)/*.txt`                     |                                 `4` |
| `*/+(bb*)/*.txt`                     |                        `402`, `307` |
| `*([a-zA-Z]/*/*.txt`                 |                        `402`, `307` |
| `*([a-zA-Z])?([0-9])/*/${title}.txt` |                `>`, `<`, `>=`, `=<` |
| `*([a-zA-Z])?([0-9])/*/${title}.txt` |               &gt;, `<`, `>=`, `=<` |
| `*([a-zA-Z])?([0-9])/*/${title}.txt` |                `>`, `<`, `>=`, `=<` |

## Conjunto de chaves: `{...}`{.noWrap}

É uma maneira de fazer com que um conjunto de instrumentos se revele mais duro. Braced set começa com `{` e termina com `}`, com qualquer número de seções delimitadas por vírgula dentro (conjuntos de chaves aninhados são permitidos). Por exemplo, `C:/+(a├{b),c)}/file.txt` expandiria para:

- `C:/dir1/dir2/file.txt`
- `C:/Roms/dir1/dir2/dir3/file.txt`

Conjuntos emparelhados também têm sintaxe de intervalo menos útil `{x..x}` onde `x` é um único caractere. Por exemplo, `C:/+(a├{b),c)}/file.txt` expandiria para:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir2/file.txt`

Um conjunto de chaves é expandido **antes do** análise real, portanto pode ser útil para gerar subdiretórios diferentes ou até mesmo ["matchers" extendidos glob](#extended-glob-matchers). Por exemplo, `C:/+(a├{b),c)}/file.txt` expandiria para:

- `C:/+(aseuropeb)/file.txt`
- `C:/+(aseuropeb)/file.txt`
