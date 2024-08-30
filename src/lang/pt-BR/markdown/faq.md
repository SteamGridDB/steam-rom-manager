# Perguntas Frequentes

Leia isto se você ainda está com problemas com a configuração. Para a maioria dos exemplos, os seguintes serão usados a não ser que especificado de contrário:

|                    |                                            |
| ------------------ | ------------------------------------------ |
| **Diretório ROMs** | `CD-ROMs`                                  |
| **Arquivo1**       | `C:/ROMs/Corações do Reino/jogo.iso`       |
| **Arquivo2**       | `C:/ROMs/Corações do Reino/jogo.iso`       |
| **Arquivo3**       | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **Arquivo4**       | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **Arquivo5**       | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **Arquivo6**       | `C:/ROMs/dir1/dir2/dir3/save.sav`          |

## Então, como faço eu configurar o mundo do usuário?

Primeiro, vamos analisar o **File1**. Seu caminho completo é `C:/ROMs/Kingdom Hearts/game.iso`. Como nosso **diretório ROMs** é `C:/ROMs`, podemos removê-lo do caminho do **File1**.

Nós terminamos com `Corações do Reino/game.iso`. É óbvio para nós que `Corações do Reino` é o título, no entanto o parser é mais burro do que você -- você deve especificar a porção do caminho que contém o título substituindo `Corações do Reino` por `${title}`.

Mais uma vez, acabamos com `${title}/game.iso`, mas também queremos **File2**, porque ele é para o mesmo emulador. **File1** é `game.iso` e **File2** é `rom.iso`. E agora?

Lembrar dos cards selvagens? Permitem-nos descartar informações que realmente não interessam. Neste caso nós não nos importamos se é `jogo` ou `rom`, nós queremos que ambas sejam correspondentes. É por isso que os substituímos por `*`. Agora, não precisamos do **File4** and **File6**:

```
${title}/*.iso
```

Usando uma lógica similar nós podemos produzir glob para **File3**:

```
{*,*/*}/*/${title}.*
```

## Como lidar com directórios de vários níveis?

Desta vez queremos **File3** and **File5** (ambas têm extensões diferentes, ler a próxima seção sobre o que fazer a respeito de agora, usaremos `*` para ignorar a extensão). Observe que **File3** tem `3` subdiretórios enquanto **File5** tem `2`. E agora?

Agora podemos usar um globstar e é isso!

```
**/${title}.*
```

É assim tão simples? **NÃO!** A Globstar terá algum impacto no desempenho do analisador se existirem muitos subdiretórios com milhares de arquivos cada. A Globstar se certificará de que o analisador verifique todos os arquivos que pode encontrar. Uma vez o usuário relatou que a análise levou ~10 minutos quando usou estrelas globais em todos os lugares.

Uma solução recomendada é usar conjuntos emparelhados. Eles podem fazer vários globs de `1` glob. Se escrevermos um glob como este:

```
{*,*/*}/*/${title}.*
```

nós vamos receber `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

Estes `2` globs satisfazem nossos arquivos, **Arquivo3** e **Arquivo5**.

## Como escrever extensões?

Digamos que usamos glob do exemplo anterior:

```
{*,*/*}/*/${title}.*
```

Acabaremos com 4 arquivos: **Arquivo3**, **Arquivo4**, **Arquivo5** e **Arquivo6**. Agora, não precisamos do **File4** and **File6**. Normalmente nós poderíamos definir globo para:

```
{*,*/*}/*/${title}.*
```

mas então vamos acabar apenas com **File3**, porque `nes` não é igual a `NES` -- analisador diferencia maiúsculas de minúsculas. Há duas maneiras de resolver este problema usando o "glob matcher" estendido.

### Exclua a extensão `sav`

Marcador glob estendido `!(...)` nos permite excluir coisas. Se escrevermos um glob como este:

```
{*,*/*}/*/${title}.*
```

e arquivos com a extensão `sav` serão excluídos.

### Verificar múltiplas extensões

Marcador glob estendido `!(...)` nos permite excluir coisas. Se escrevermos um glob como este:

```
{*,*/*}/*/${title}.*
```

e somente arquivos com `nes` e `NES` serão correspondidos. Se estiver se sentindo elegante ou se tiver arquivos com extensões `nes`, `NES`, `neS`, `nEs`, `Nes` e etc. você precisa de um globo que usa o intervalo de caracteres:

```
{*,*/*}/*/${title}.*
```

Agora, o analisador pode combinar qualquer combinação e é efectivamente insensível a maiúsculas e minúsculas. Tecnicamente, a seguinte luva também funcionará, mas a acima parece melhor.

```
{*,*/*}/*/${title}.*
```

## Resolução de problemas

- Por favor, certifique-se de que o Steam está realmente fechado antes de salvar sua lista de aplicativos.

- Uma questão comum que o Steam ROM Manager enfrenta é a presença de antigos diretórios Steam de pessoas que se conectaram ao Steam no seu computador antes da atualização da Nova Biblioteca. Isto pode causar falhas no Gerenciador de ROM Steam de formas imprevisíveis, pois ele tenta acessar diretórios cuja estrutura mudou. Para contornar isso, use o campo [Contas de Usuário](#user-accounts) para especificar com quais contas você realmente quer usar o gerente de ROM Steam com.

## O Discord

Para mais ajuda, consulte o nosso [Discord](https://discord.gg/bnSVJrz).
