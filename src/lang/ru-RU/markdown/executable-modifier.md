# Модификатор исполняемого файла `[поддерживает переменные]`{.noWrap}

Значение по умолчанию: `"${exePath}"`{.noWrap}. Этот параметр можно использовать для добавления или добавления нужных символов к исполняемому файлу, который будет добавлен в Steam (свойство `Target`). Например, учитывая, что `${exePath}`{.noWrap} - это `C:\RetroArch\retroarch.exe`, вы можете добавить `"cmd" /k start /min` к нему, задав значение:
```
"cmd" /k start /min "${exePath}"
```
Вы можете использовать любую другую переменную для создания конечного исполняемого файла.

Эта настройка влияет на APP ID Steam.


## Переход через ярлык
Если вы включите опцию "Следовать .lnk к месту назначения", а ваш исполняемый файл - это ".lnk", то есть ярлык, то все, что вы введете в это поле, будет заменено на цель этого ярлыка. Если вы хотите добавить исполняемые аргументы, добавьте их в цель ярлыка или используйте поле "Аргументы командной строки" в анализаторе.

## Переменные каталога

| Переменная (без учета регистра) | Соответствующее значение                  |
| -------------------------------:|:----------------------------------------- |
|                     `${exeDir}` | Каталог исполняемых файлов                |
|                     `${romDir}` | Каталог ROMs                              |
|                   `${steamDir}` | Каталог Steam                             |
|                 `${startInDir}` | "StartIn" directory                       |
|                    `${fileDir}` | Files returned by a parser or a directory |

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

| Variable (case-insensitive) | Corresponding value                                |
| ---------------------------:|:-------------------------------------------------- |
|                `${exePath}` | Full path to an executable                         |
|               `${filePath}` | Full path to a file which was returned by a parser |

In case executable directory input is left **empty**, `${exePath}`{.noWrap} is equal to `${filePath}`{.noWrap}.

## Parser variables

| Variable (case-insensitive) | Corresponding value                              |
| ---------------------------:|:------------------------------------------------ |
|                  `${title}` | Extracted title                                  |
|             `${fuzzyTitle}` | Fuzzy matched title                              |
|             `${finalTitle}` | Title which was the end result of title modifier |

In case fuzzy matching **fails** or is **disabled**, `${fuzzyTitle}`{.noWrap} is equal to `${title}`{.noWrap}.

## Function variables

|                                 Variable (case-insensitive) | Corresponding function                                                                                                 |
| -----------------------------------------------------------:|:---------------------------------------------------------------------------------------------------------------------- |
|                 `${regex\|input\|substitution(optional)}` | Executes regex on input. Supports `u`, `g` and `i` flags (captured groups are joined, unless substitution is provided) |
|                                             `${uc\|input}` | Uppercase variable. Transforms input to uppercase                                                                      |
|                                             `${lc\|input}` | Lowercase variable. Transforms input to lowercase                                                                      |
|                                       `${cv:group\|input}` | Change input with matched custom variable (group is optional)                                                          |
|                                            `${rdc\|input}` | Replace diacritic input characters with their latin equivalent                                                         |
| `${os:[win\|mac\|linux]\|on match\|no match(optional)}` | If OS matches, uses `on match` value or `no match` otherwise                                                           |

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
