# Executable modifier `[supports variables]`{.noWrap}

Default value is `"${exePath}"`{.noWrap}. This setting can be used to prepend or append desired characters to an executable which will be added to Steam (`Target` property). For example, given that `${exePath}`{.noWrap} is `C:\RetroArch\retroarch.exe`, you can add `"cmd" /k start /min` to it by setting value to:
```
"cmd" /k start /min "${exePath}"
```
You can use any other variable to construct the final executable.

This setting influences Steam's APP ID.


## Shortcut Passthrough
If you enable "Follow .lnk to destination" and your executable is a ".lnk" file, ie a shortcut, then whatever you put in this field will be overridden with the target of that shortcut. If you would like to add executable arguments either add them to the target of the shortcut or use the "Command Line Arguments" field in the parser.

## Directory variables

| Variable (case-insensitive) | Corresponding value                     |
| ---------------------------:|:--------------------------------------- |
|                 `${exeDir}` | Executable directory                    |
|                 `${romDir}` | ROMs directory                          |
|               `${steamDir}` | Steam directory                         |
|             `${startInDir}` | "StartIn" directory                     |
|                `${fileDir}` | File's, returned by a parser, directory |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeDir}`{.noWrap} é igual a `${fileDir}`{.noWrap}. Além disso, se o diretório "StartIn" for deixado **vazio**, `${startInDir}`{.noWrap} é igual a `${exeDir}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                        |
| ----------------------------------:|:------------------------------------------------------------------ |
|                       `${exeName}` | Nome do executável (sem extensão)                                  |
|                      `${fileName}` | Nome do arquivo que foi retornado por um analisador (sem extensão) |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeName}`{.noWrap} é igual a `${fileName}`{.noWrap}.

## Variáveis de extensão

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                            |
| ----------------------------------:|:---------------------------------------------------------------------- |
|                        `${exeExt}` | Extensão do executável (com um ponto)                                  |
|                       `${fileExt}` | Extensão do arquivo que foi retornado por um analisador (com um ponto) |

Caso a entrada do diretório executável seja deixada **vazia**, `${exeExt}`{.noWrap} é igual a `${fileExt}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                          |
| ----------------------------------:|:-------------------------------------------------------------------- |
|                       `${exePath}` | Caminho completo para um executável                                  |
|                      `${filePath}` | Caminho completo para um arquivo que foi retornado por um analisador |

Caso a entrada do diretório executável seja deixada **vazia**, `${exePath}`{.noWrap} é igual a `${filePath}`{.noWrap}.

## Variáveis de nome

| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                                 |
| ----------------------------------:|:----------------------------------------------------------- |
|                         `${title}` | Título extraído                                             |
|                    `${fuzzyTitle}` | Título difuso correspondente                                |
|                    `${finalTitle}` | O título que foi o resultado final do modificador do título |

No caso de correspondência difusa **falhar** ou está **desabilitado**, `${fuzzyTitle}`{.noWrap} é igual a `${title}`{.noWrap}.

## Custom variables

|                          Variável (maiúsculas e minúsculas) | Função correspondente                                                                                                                           |
| -----------------------------------------------------------:|:----------------------------------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\├input\├substitution(opcional)}` | Executa a expressão regex na entrada. Suporta `u`, `g` e `i` bandeiras (grupos capturados se juntam, a menos que a substituição seja fornecida) |
|                                             `${uc\├input}` | Variável maiúscula. Transformar em maiúsculas                                                                                                   |
|                                             `${uc\├input}` | Variável maiúscula. Transformar em maiúsculas                                                                                                   |
|                                       `${cv:group\├input}` | Alterar entrada com variável personalizada correspondente (grupo é opcional)                                                                    |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                                                  |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                                                    |

### Function variable example

Let's say that `${title}` variable equals to `Pokémon (USA) (Disc 1).iso`. Then these variables:
```
${/.*/|${title}}                           //Matches everything
${/(.*)/|${title}}                         //Captures everything
${/(\(.*?\))/|${title}|}                   //Captures all brackets and substitutes with nothing
${/(\(Disc\s?[0-9]\))/|${title}}           //Captures "Disc..." part
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Captures "Disc..." part and transforms it to uppercase
${rdc|${title}}                            //Replace diacritic characters (in this case: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Selects correct file extension for OS
```
will be replaced with these:
```
Pokémon (USA) (Disc 1).iso
Pokémon (USA) (Disc 1).iso
Pokémon.iso
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
