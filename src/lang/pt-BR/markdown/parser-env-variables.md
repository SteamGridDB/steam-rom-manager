## Variáveis de ambiente

Essas variáveis são pré-analisadas e podem ser usadas até nos campos Rom Directory, Diretório Steam, Localização Executável e Iniciar em Dir.
| Variável (maiúsculas e minúsculas) | Sobreposição correspondente |
| ----------------------------------:|:------------------------------------------------------------------------ |
| `${/}` | Separador de diretório específico do sistema: `\` ou `/` |
| `${srmdir}` | Diretório de executável SRM portátil |
| `${steamdirglobal}` | Diretório Steam global, especificado em `Configurações` |
| `${accountsglobal}` | Global user accounts, specified in `Settings` |
| `${romsdirglobal}` | Diretório global de ROMs, especificado em `Configurações` |
| `${retroarchpath}` | Caminho para o executável de Retroarcha, especificado em `Configurações` |
| `${racores}` | Diretório de núcleos de retroarca, especificado em `Configurações` |
| `${localimagesdir}` | Diretório de núcleos de retroarca, especificado em `Configurações` |

A utilidade da variável de ambiente `${srmdir}` é tornar a SRM totalmente portátil, por exemplo, se você quisesse ter o layout dos diretórios `D:\Games\Rsala` e `D:\Games\PortableSRM\SRM. xe` então defina o campo Roms Directory para ser `${srmdir}${/}.. {/}Roms` permitiria que você movesse o diretório Jogos para outro lugar sem quebrar sua configuração.
