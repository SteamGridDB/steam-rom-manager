# Imagem de logotipo padrão (opcional) `[suporta variáveis]`{.noWrap}

Argumentos que são anexados ao executável para produzir o atalho final. Na maioria das vezes você vai querer configurá-lo usando as variáveis de análise fornecidas.

## Exemplos por Sistema

### RetroArch

```
-L núcleos${/}SEU_CORE.dll "${filePath}"
```

### Cemu (WiiU)

```
-f -g "${filePath}"
```

### Format@@0 Dolphin Emu (Gamecube and Wii)

```
--exec="${filePath}" --batch --confirm=false
```

### Projeto 64 2.3+ (N64)

```
"${filePath}"
```

### Mupen64+ (N64)

```
--fullscreen "${filePath}"
```

### DeSmuME (Nintendo DS)

```
"${filePath}"
```

### mGBA (Gameboy, Gameboy Color, e Gameboy Advance)

```
-f -g "${filePath}"
```

### Nestopia (NES/Família)

```
"${filePath}" -video fullscreen bpp : 16 -video fullscreen largura em tela cheia: 1024 -video fullscreen altura : 768 -preferences fullscreen no inicio : yes -view size fullscreen : esticado
```

### higan (NES/Famicom, SNES/Famicom, Gameboy, Cor do Gameboy, Advance)

```
"${filePath}"
```

### nullDC (Sega Dreamcast)

```
-config nullDC_GUI:Fullscreen=1 -config ImageReader:DefaultImage="${filePath}"
```

### Fusão Kega (Sega Gênesis e Sega 32X)

```
"${filePath}" -gen -auto -tela cheia
```

### RPCS3 (Sony PlayStation 3)

```
"${filePath}"
```

### EPSXe (Sony PlayStation 2)

```
--fullscreen "${filePath}"
```

### EPSXe (Sony PlayStation 1)

```
-nogui -cdfile "${filePath}"
```

### ePSXe (Sony PlayStation 1)

```
-nogui -cdfile "${filePath}"
```

### Xebra (Sony Playstation 1)

```
-IMAGEM "${filePath}" -RUN1 -COMPLETO
```

### Mednafen (Sony Playstation 1, NES/Famicom, SNES/Super Família, etc.)

```
"${filePath}"
```

### PPSSPP (Sony Playstation portable)

```
"${filePath}"
```

## O que faz "Acrescentar argumentos ao executável"?

Ao invés de adicionar argumentos para as opções de lançamento do Steam:

![Argumentos não anexados](../../../assets/images/cmd-not-appended.png) {.fitImage.center}

argumentos são anexados ao destino, como mostrado abaixo:

![Argumentos anexados](../../../assets/images/cmd-appended.png) {.fitImage.center}

Esta configuração é usada para influenciar o ID APP do Steam.

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
