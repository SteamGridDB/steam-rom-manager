## Variáveis de ambiente
Essas variáveis são pré-analisadas e podem ser usadas até nos campos Rom Directory, Diretório Steam, Localização Executável e Iniciar em Dir.
| Variável (maiúsculas e minúsculas) | Sobreposição correspondente                               |
| ----------------------------------:|:--------------------------------------------------------- |
|                             `${/}` | Separador de diretório específico do sistema: `\` ou `/` |
|                        `${srmdir}` | Directory of portable SRM executable                      |
|                `${steamdirglobal}` | Global steam directory, specified in `Settings`           |
|                 `${romsdirglobal}` | Global ROMs directory, specified in `Settings`            |
|                 `${retroarchpath}` | Path to Retroarch executable, specified in `Settings`     |
|                       `${racores}` | Directory of retroarch cores, specified in `Settings`     |
|                `${localimagesdir}` | Directory of your local images, specified in `Settings`   |


The utility of the environment variable `${srmdir}` is to make SRM fully portable, eg if you wanted to have the directory layout `D:\Games\Roms` and `D:\Games\PortableSRM\SRM.exe` then setting the field Roms Directory to be `${srmdir}${/}..${/}Roms` would allow you to move the Games directory somewhere else without breaking your setup.
