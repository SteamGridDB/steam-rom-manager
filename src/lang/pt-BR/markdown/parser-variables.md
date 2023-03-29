# Parser variables

Here are tables of variables that can be used with options that have `[supports variables]`{.noWrap} specified in their descriptions. Variable can be nested.

## Directory variables

| Variable (case-insensitive) | Corresponding value                     |
| ---------------------------:|:--------------------------------------- |
|                 `${exeDir}` | Executable directory                    |
|                 `${romDir}` | ROMs directory                          |
|               `${steamDir}` | Steam directory                         |
|             `${startInDir}` | "StartIn" directory                     |
|                `${fileDir}` | File's, returned by a parser, directory |

In case executable directory input is left **empty**, `${exeDir}`{.noWrap} is equal to `${fileDir}`{.noWrap}. Moreover, if "StartIn" directory is left **empty**, `${startInDir}`{.noWrap} is equal to `${exeDir}`{.noWrap}.

## Name variables

| Variable (case-insensitive) | Corresponding value                                             |
| ---------------------------:|:--------------------------------------------------------------- |
|                `${exeName}` | Name of executable (without extension)                          |
|               `${fileName}` | Name of file which was returned by a parser (without extension) |

In case executable directory input is left **empty**, `${exeName}`{.noWrap} is equal to `${fileName}`{.noWrap}.

## Extension variables

| Variable (case-insensitive) | Corresponding value                                           |
| ---------------------------:|:------------------------------------------------------------- |
|                 `${exeExt}` | Extension of executable (with a dot)                          |
|                `${fileExt}` | Extension of file which was returned by a parser (with a dot) |

In case executable directory input is left **empty**, `${exeExt}`{.noWrap} is equal to `${fileExt}`{.noWrap}.

## Path variables

| Variable (case-insensitive) | Corresponding value                                                  |
| ---------------------------:|:-------------------------------------------------------------------- |
|                `${exePath}` | Caminho completo para um executável                                  |
|               `${filePath}` | Caminho completo para um arquivo que foi retornado por um analisador |

Caso a entrada do diretório executável seja deixada **vazia**, `${exePath}`{.noWrap} é igual a `${filePath}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                 |
| ----------------------------------:|:----------------------------------------------------------- |
|                         `${title}` | Título extraído                                             |
|                    `${fuzzyTitle}` | Título difuso correspondente                                |
|                    `${finalTitle}` | O título que foi o resultado final do modificador do título |

No caso de correspondência difusa **falhar** ou está **desabilitado**, `${fuzzyTitle}`{.noWrap} é igual a `${title}`{.noWrap}.

## Custom variables

|                               Variável (maiúsculas e minúsculas) | Função correspondente                                                                                                                           |
| ----------------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------- |
|                      `${regex\├input\├substitution(opcional)}` | Executa a expressão regex na entrada. Suporta `u`, `g` e `i` bandeiras (grupos capturados se juntam, a menos que a substituição seja fornecida) |
|                                                  `${uc\├input}` | Variável maiúscula. Transformar em maiúsculas                                                                                                   |
|                                                  `${uc\├input}` | Variável maiúscula. Transformar em maiúsculas                                                                                                   |
|                                            `${cv:group\├input}` | Alterar entrada com variável personalizada correspondente (grupo é opcional)                                                                    |
|                                                  `${uc\├input}` | Substituir caracteres diacríticos de entrada com seu equivalente latino                                                                         |
| `${os:[win\├mac\├linux]\├na ocorrência\├no match(opcional)}` | Se o SO corresponder, usa `na correspondência valor` ou `não corresponde` caso contrário                                                        |

### Exemplo de variável função

Digamos que a variável `${title}` é igual a `Poke├mon (EUA) (Disc 1).iso`. Então essas variáveis:
```
${/.*/➲${title}} //Corresponde a tudo
${/(.)/，${title}} //Captura tudo
${/(\(.?\))/├${title}├} //Captura todos os parênteses e substitutos com nada
${/(\(Discos?[0-9]\))/├${title}} /Captures "Disco... parte
${uccerteza, ${/(\(Disc\s?[0-9]\))/¡${title}}} //Captures "Disco... peça e transforma em maiúsculas
${rdc├${title}} //Substituir caracteres diacríticos (nesse caso: e├-> e)
arquivo${os:linuxwill.. oive ${os:win|.dll}} //Selects a extensão de arquivo correta para o SO
```
será substituído por estes:
```
Pokémon (USA) (Disc 1).iso Pokémon (USA) (Disc 1).iso Pokémon.iso
(Disc 1)
(DISC 1)
Pokemon (USA) (Disc 1).iso

--On linux:
file.so
--On Windows:
file.dll
--On Mac OS:
file
```
