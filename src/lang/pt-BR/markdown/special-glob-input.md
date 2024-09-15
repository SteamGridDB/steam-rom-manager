# Entrada glob especial

## Como funciona?

Caminhos de imagem são resolvidos no processo de 4 etapas:

1. A frase é avaliada para ver se um analisador baseado em glob é usado. Dependendo do resultado, a análise futura pode continuar com `2` conjuntos de glob.
1. Todas as variáveis fornecidas são substituídas por seus valores correspondentes.
1. Novas string(s) é/são resolvidas contra o diretório raiz (diretório raiz é sempre o diretório ROMs de configuração de configuração).
1. As string(s) finais/são passadas para o analisador de globas, que retorna uma lista de arquivos disponíveis.

## Exemplos de uso

### Caminhos Absolutos

Digamos que o título extraído é `Fusão Metroid [USA]` e título difuso é `Fusão Metroid`. Você pode então construir um caminho de imagem como este:

- `C:/path/to/images/${title}.*`
- `C:/path/to/images/${fuzzyTitle}.*`

que será resolvido para isso:

- `C:/path/to/images/Fusão Metroid [USA].png`
- `C:/path/para/imagens/Fusion.jpg Metroid`

### Caminhos relativos

Para este exemplo, digamos que o diretório ROMs é `C:/ROMS/GBA` e a rom em si é `C:/ROMS/GBA/Metroid Fusion [USA].gba`. Configure um caminho relativo usando `${filePath}`{.noWrap} ou `${dir}`{.noWrap} variáveis, por exemplo:

- `${filePath}/../../../caminho/para/images/${title}.*`
- `${dir}/../../caminho/para/images/${title}.*`

será substituído por estes:

- `C:/ROMS/GBA/Fusão Metroid [USA].gba/../../../path/to/images/Fução Metroid.*`
- `C:/ROMS/GBA/../../caminho/para/images/Fução Metroid.*`

Aqui `..` significa "cruzar de volta" e permite voltar ao diretório anterior:

- `C:/ROMS/GBA/Fusão Metroid [USA].gba/../../../path/to/images/Fução Metroid.*`
  - `C:/ROMS/GBA/../../caminho/para/images/Fução Metroid.*`
    - `C:/ROMS/GBA/../../caminho/para/images/Fução Metroid.*`
      - `C:/path/para/imagens/Fusion. jpg Metroid`
- `C:/ROMS/GBA/../../caminho/para/images/Fução Metroid.*`
  - `C:/ROMS/GBA/../../caminho/para/images/Fução Metroid.*`
    - `C:/path/para/imagens/Fusion. jpg Metroid`
