# Caractères globaux spéciaux

## Wildcards: `*`, `?`, `[...]`{.noWrap}

- `*` -- correspondances **0** ou **more** caractères dans une **single** portion de chemin;
- `?` -- correspond exactement **1** caractère;
- `[...]`{.noWrap} -- correspond à une série de caractères. Si le premier caractère entre parenthèses est `!` ou `^` alors il correspond à un caractère qui n'est pas dans la gamme:
  - `[abc]`{.noWrap} -- correspondances `a`, `b` ou `c` caractères;
  - `[!abc]`{.noWrap} -- correspond à n'importe quel caractère sauf `a`, `b` ou `c`;
  - `[0-9]`{.noWrap} -- correspond à n'importe quel caractère entre `0` et `9` caractères (toutes les valeurs)
  - `[a-z]`{.noWrap} -- correspond à n'importe quel caractère entre `a` et `z` caractères (alphabet anglais inférieur).

## Globstar: `**`

`**` correspondances **0** ou **more** les répertoires et sous-répertoires recherchant des correspondances. Si les répertoires ont un **lot** des sous-répertoires, il causera des problèmes de performance. Si possible, utilisez [braced sets](#braced-sets).

## Jumelles globulaires étendues: `!(...)`{.noWrap}, `?(...)`{.noWrap}, `+(...)`{.noWrap}, `*(...)`{.noWrap}, `@(...)`{.noWrap}

Il permet de spécifier comment utiliser des motifs à partir de caractères simples et jokers. Plusieurs motifs peuvent être spécifiés à l'intérieur `(...)`{.noWrap} et séparés par `|`.

- `!(...)`{.noWrap} -- correspond à quelque chose **except** un des motifs donnés(s);
- `?(...)`{.noWrap} -- correspond à **zero** ou **one** l'apparition du (des) motif (s) donné (s);
- `+(...)`{.noWrap} -- correspond à **one** ou **more** l'apparition du (des) motif (s) donné (s);
- `*(...)`{.noWrap} -- correspond à **zero** ou **more** l'apparition du (des) motif (s) donné (s);
- `@(...)`{.noWrap} -- correspond à **one** du (des) motif (s) donné (s).

Vu les chemins d'accès aux fichiers,

1. `dir1/file.txt`;
1. `dir2/dir3/file.txt`;
1. `dir4/111222/file.txt`;
1. `DIR/abc/file.txt`;
1. `DIR/abcabc/file.txt`;
1. `123/aabbcc/file.txt`;

Voici quelques exemples d'action des globes globulaires étendus:

|Glob patterns|Correspondances (liste des numéros)|
|:---|---:|
|`@(dir[12]|DIR)/**/*.txt`|`1`, `2`, `4`, `5`|
|`!(dir[12]|DIR)/**/*.txt`|`3`, `6`|
|`*/!(*bb*)/*.txt`|`2`, `3`, `4`, `5`|
|`*/?(abc)/*.txt`|`4`|
|`*/+(abc)/*.txt`|`4`, `5`|
|`*([a-zA-Z])/*/*.txt`|`4`, `5`|
|`*([a-zA-Z])?([0-9])/*/${title}.txt`|`2`, `3`, `4`, `5`|
|`*([a-zA-Z])+([0-9])/*/${title}.txt`|`2`, `3`, `6`|
|`*([a-zA-Z])*([0-9])/*/${title}.txt`|`2`, `3`, `4`, `5`, `6`|

## Ensembles contreventements: `{...}`{.noWrap}

C'est une façon de créer des modèles plus globaux à partir d'un ensemble. Le jeu de contreventements commence par `{` et se termine par `}`, avec un nombre quelconque de sections délimitées par des virgules (les jeux de contreventements emboîtés sont autorisés). Par exemple, `C:/dir1/{dir2,dir3/dir4}/file.txt` s'étendra à:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/dir4/file.txt`

Les jeux de contreventements ont également une syntaxe de portée moins utile. `{x..x}` là où `x` est un seul caractère. Par exemple, `C:/dir1/dir{2..4}/file.txt` s'étendra à:

- `C:/dir1/dir2/file.txt`
- `C:/dir1/dir3/file.txt`
- `C:/dir1/dir4/file.txt`

Le jeu de contreventements est élargi **before** l'analyse réelle, donc peut être utile pour générer différents sous-répertoires ou même [extended glob matchers](#extended-glob-matchers). Par exemple, `C:/+(a|{b),c)}/file.txt` s'étendrait à:

- `C:/+(a|b)/file.txt`
- `C:/+(a|c)/file.txt`
