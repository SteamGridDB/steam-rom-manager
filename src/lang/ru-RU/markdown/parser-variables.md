# Parser variables

Here are tables of variables that can be used with options that have `[supports variables]`{.noWrap} specified in their descriptions. Variable can be nested.

## Directory variables

| Variable (case-insensitive) | Corresponding value                       |
| ---------------------------:|:----------------------------------------- |
|                 `${exeDir}` | Executable directory                      |
|                 `${romDir}` | ROMs directory                            |
|               `${steamDir}` | Steam directory                           |
|             `${startInDir}` | "StartIn" directory                       |
|                `${fileDir}` | Files returned by a parser or a directory |

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
|            `${parserTitle}` | The value of the `Parser Title` field            |

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
${/.*/|${title}}                           //Подходит ко всему
${/(.*)/|${title}}                         //Захватывает все
${/(\(.*?\))/|${title}|}                   //Захватывает все скобки и заменяет их ничем
${/(\(Disc\s?[0-9]\))/|${title}}           //Захватывает часть "Диск...".
${uc|${/(\(Disc\s?[0-9]\))/|${title}}}     //Захватывает часть "Диск..." и преобразует ее в верхний регистр
${rdc|${title}}                            //Замените диакритические знаки (в данном случае: é -> e)
file${os:linux|.so|${os:win|.dll}}         //Выбор правильного расширения файла для ОС
```

будут заменены на эти:

```
Pokémon (США) (Disc 1).iso
Pokémon (США) (Disc 1).iso
Pokémon.iso
(Диск 1)
(ДИСК 1)
Pokemon (USA) (Disc 1).iso

-- На linux:
file.so
-- На Windows:
file.dll
-- На Mac OS:
file
```
