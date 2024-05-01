# Glob Parser Specific Inputs

## Global do usuário

Aqui é onde você cria seu glob para extrair o título do caminho do arquivo. Leia todos os [caracteres especiais glob](#special-glob-characters) se você não sabe como construir um glob.

## Como funciona?

Além de caracteres glob especiais, o analisador glob requer que você digite a variável `${title}`{.noWrap}. O analisador localizará sua posição dentro do seu  **glob**, por exemplo:

| Global do usuário          | Posição                    |
| -------------------------- | -------------------------- |
| `${title}/*/*.txt`         | Primeiro nível da esquerda |
| `{*,*/*}/${title}/*/*.txt` | Primeiro nível da esquerda |
| `**/${title}/*/*.txt`      | Primeiro nível da esquerda |

Depois de adquirir a posição de `${title}`{.noWrap}, `${title}`{.noWrap} será substituído por um curinga `*`.

## Limitações

A extração de posição vem com algumas limitações -- glob é inválido se a posição não puder ser extraída. Na maioria das vezes você será avisado sobre o que você não pode fazer, no entanto, se você encontrar uma combinação que é permitida, mas produz títulos incorretos, por favor faça um problema no [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
