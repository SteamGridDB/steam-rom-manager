# Frequently asked questions

Read this if you're still having trouble with configuration. For most examples the following will be used unless specified otherwise:

|                    |                                            |
| ------------------ | ------------------------------------------ |
| **ROMs directory** | `C:/ROMs`                                  |
| **File1**          | `C:/ROMs/Kingdom Hearts/game.iso`          |
| **File2**          | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **File3**          | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **File4**          | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **File5**          | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **File6**          | `C:/ROMs/dir1/dir2/save.sav`               |

## So, how do I setup user's glob?

First, let's analyze **File1**. Its full path is `C:/ROMs/Kingdom Hearts/game.iso`. Since our **ROMs directory** is `C:/ROMs`, we can just remove it from **File1**'s path.

We end up with `Kingdom Hearts/game.iso`. It obvious for us that `Kingdom Hearts` is the title, however parser is dumber than you -- you must specify path portion which contains the title by replacing `Kingdom Hearts` with `${title}`.

Again, we end up with `${title}/game.iso`, but we also want **File2**, because it is for the same emulator. **File1** is `game.iso` and **File2** is `rom.iso`. What now?

Remember wild cards? They allow us to discard information that does not really matter. In this case we don't care if it is `game` or `rom`, we want both to be matched. That's why we replace them with `*`. This is the final glob for both **File1** and **File2**:

```
${title}/*.iso
```

Using similar logic we can produce glob for **File3**:

```
*/*/*/${title}.nes
```

## How to deal with multi-leveled directories?

This time we want **File3** and **File5** (both have different extensions, read next section on what to do about it as for now we will use `*` to ignore extension). Notice that **File3** has `3` subdirectories while  **File5** has `2`. What now?

Now we can use a globstar and that's it!
```
**/${title}.*
```
... É assim tão simples? **NÃO!** A Globstar terá algum impacto no desempenho do analisador se existirem muitos subdiretórios com milhares de arquivos cada. A Globstar se certificará de que o analisador verifique todos os arquivos que pode encontrar. Uma vez o usuário relatou que a análise levou ~10 minutos quando usou estrelas globais em todos os lugares.

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
* Por favor, certifique-se de que o Steam está realmente fechado antes de salvar sua lista de aplicativos.

* Uma questão comum que o Steam ROM Manager enfrenta é a presença de antigos diretórios Steam de pessoas que se conectaram ao Steam no seu computador antes da atualização da Nova Biblioteca. Isto pode causar falhas no Gerenciador de ROM Steam de formas imprevisíveis, pois ele tenta acessar diretórios cuja estrutura mudou. Para contornar isso, use o campo [Contas de Usuário](#user-accounts) para especificar com quais contas você realmente quer usar o gerente de ROM Steam com.

## O Discord

Para mais ajuda, consulte o nosso [Discord](https://discord.gg/bnSVJrz).
