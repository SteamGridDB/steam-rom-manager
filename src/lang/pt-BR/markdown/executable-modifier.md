# Imagem padrão (opcional) `[suporta variáveis]`{.noWrap}

O valor padrão é `${exePath}`{.noWrap}. Esta configuração pode ser usada para antecipar ou anexar caracteres desejados a um executável que será adicionado à propriedade Steam (`Target`). Por exemplo, dado que `${exePath}`{.noWrap} é `C:\RetroArch\retroarch. xeque`, você pode adicionar `"cmd" /k start /min` definindo o valor para:

```
"cmd" /k start /min "${exePath}"
```

Você pode usar qualquer outra variável para construir o executável final.

Esta configuração é usada para influenciar o ID APP do Steam.

## Mostrar a passagem

Se você ativar "Seguir .lnk para destino" e o seu executável é um ". arquivo nk", ou seja, um atalho, então tudo o que você colocar neste campo será sobrescrito com o alvo desse atalho. Se você gostaria de adicionar argumentos executáveis adicioná-los ao alvo do atalho ou use o campo "Argumentos de Linha de Comando" no analisador.

## Variáveis de diretório

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                  |
| ---------------------------------: | :------------------------------------------- |
|                        `${exeDir}` | Diretório executável                         |
|                        `${romDir}` | Diretório ROMs                               |
|                      `${steamDir}` | Diretório Steam                              |
|                    `${startInDir}` | Diretório inicial                            |
|                       `${fileDir}` | Arquivo retornado pelo analisador, diretório |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeDir}`{.noWrap} é igual a `${fileDir}`{.noWrap}. Além disso, se o diretório "StartIn" for deixado **vazio**, `${startInDir}`{.noWrap} é igual a `${exeDir}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                        |
| ---------------------------------: | :----------------------------------------------------------------- |
|                       `${exeName}` | Nome do executável (sem extensão)                                  |
|                      `${fileName}` | Nome do arquivo que foi retornado por um analisador (sem extensão) |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeName}`{.noWrap} é igual a `${fileName}`{.noWrap}.

## Variáveis de extensão

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                            |
| ---------------------------------: | :--------------------------------------------------------------------- |
|                        `${exeExt}` | Extensão do executável (com um ponto)                                  |
|                       `${fileExt}` | Extensão do arquivo que foi retornado por um analisador (com um ponto) |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeExt}`{.noWrap} é igual a `${fileExt}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                          |
| ---------------------------------: | :------------------------------------------------------------------- |
|                       `${exePath}` | Caminho completo para um executável                                  |
|                      `${filePath}` | Caminho completo para um arquivo que foi retornado por um analisador |

Caso a entrada do diretório executável seja deixada **vazia**, `${exePath}`{.noWrap} é igual a `${filePath}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                 |
| ---------------------------------: | :---------------------------------------------------------- |
|                         `${title}` | Título extraído                                             |
|                    `${fuzzyTitle}` | Título difuso correspondente                                |
|                    `${finalTitle}` | O título que foi o resultado final do modificador do título |

No caso de correspondência difusa **falhar** ou está **desabilitado**, `${fuzzyTitle}`{.noWrap} é igual a `${title}`{.noWrap}.

## Custom variables

|                           Variável (maiúsculas e minúsculas) | Função correspondente                                                                                                                           |
| -----------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------- |
|                    `${regex\├input\├substitution(opcional)}` | Executa a expressão regex na entrada. Suporta `u`, `g` e `i` bandeiras (grupos capturados se juntam, a menos que a substituição seja fornecida) |
|                                               `${uc\├input}` | Variável maiúscula. Transformar em maiúsculas                                                                                                   |
|                                               `${uc\├input}` | Variável maiúscula. Transformar em maiúsculas                                                                                                   |
|                                         `${cv:group\├input}` | Alterar entrada com variável personalizada correspondente (grupo é opcional)                                                                    |
|                                               `${uc\├input}` | Substituir caracteres diacríticos de entrada com seu equivalente latino                                                                         |
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
