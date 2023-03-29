# User's glob-regex

This is where you create your glob for extracting title from file path. Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob.

## How does it work?

In addition to special glob characters, glob parser requires you to enter `${/.../}`{.noWrap} variable. Parser will locate it's position inside your  glob, for example:

| User's glob           | Position                    |
| --------------------- | --------------------------- |
| `${/.+/}/*/*.txt`     | First level from the left   |
| `{*,*/*}/${/.+/}.txt` | First level from the right  |
| `**/${/.+/}/*.txt`    | Second level from the right |

After acquiring `${/.../}`{.noWrap} position, `${/.../}`{.noWrap} will be replaced with a wildcard `*`.

## Regex post-processing

After title extraction, title will be processed by a regular expression. There are 3 ways you can write a regular expression.

### Regular expression with no capture: `${/.+/}`{.noWrap}

This is practically identical to "Glob" parser -- every piece of extracted title will be used.

### Regular expression with capture brackets: `${/(.+)/}`{.noWrap}

Múltiplas correspondências e grupos de captura são permitidos. Por exemplo, aqui temos dois grupos de correspondência com vários grupos de captura:
```
${/(.*?)\s*\[USA\]\s*(.+) thanking (.*)/}
```
O grupo de primeira partida (da esquerda para a direita) com todas as capturas corretas serão usadas. Além disso, todos os grupos de captura serão **unidos**.

### Expressão regular com parênteses de captura e texto de substituição: `${/(.+)/^\\...}`{.noWrap}

Semelhante a [expressão regular com parênteses de captura](#regular-expression-with-capture-brackets) exceto a forma como lida com grupos capturados. O texto de substituição pode ser usado para mover os grupos capturados. Por exemplo:
```
${/(.*?)\s*\[USA\]\s*(.+)/├Segundo grupo de captura: "$2" precede o primeiro, que é "$1" }
```
Se nosso primeiro grupo de captura for `Legend of Zelda` e o segundo é `SUPER EDIÇÃO`, então obteremos o seguinte título (não muito útil):

`Segundo grupo de captura: "EDIÇÃO SUPER" precede o primeiro, que é "Legenda de Zelda"`

O texto não tocado permanecerá por padrão, então se você ver alguns caracteres à direita lembre-se de adicionar `.` no final ou `.*?` na mendicidade de expressão regular.

### Bandeiras Suportadas

Valores aceitos são `cpf`, `cnpj` e `other`.

## Limitações

A extração de posição vem com algumas limitações -- glob é inválido se a posição não puder ser extraída. Na maioria das vezes você será avisado sobre o que você não pode fazer, no entanto, se você encontrar uma combinação que é permitida, mas produz títulos incorretos, por favor faça um problema no [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
