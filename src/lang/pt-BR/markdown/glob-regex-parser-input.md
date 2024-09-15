# Glob-regex Parser specific inputs

## Regex do usuário global

Aqui é onde você cria seu glob para extrair o título do caminho do arquivo. Leia todos os [caracteres especiais glob](#special-glob-characters) se você não sabe como construir um glob.

## Como funciona?

Além de caracteres glob especiais, o analisador glob requer que você digite a variável `${title}`{.noWrap}. O analisador localizará sua posição dentro do seu glob, por exemplo:

| Global do usuário     | Posição                    |
| --------------------- | -------------------------- |
| `${/.+/}/*/*.txt`     | Primeiro nível da esquerda |
| `{*,*/*}/${/.+/}.txt` | Primeiro nível da esquerda |
| `**/${/.+/}/*.txt`    | Primeiro nível da esquerda |

Depois de adquirir a posição de `${title}`{.noWrap}, `${title}`{.noWrap} será substituído por um curinga `*`.

## Pós-processamento de Regex

Após a extração do título, o título será processado por uma expressão regular. Há três maneiras de escrever uma expressão regular.

### Expressão regular sem captura: `${/.+/}`{.noWrap}

Isso é praticamente idêntico ao analisador "Glob" -- cada pedaço do título extraído será usado.

### Expressão regular sem captura: `${/.+/}`{.noWrap}

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
