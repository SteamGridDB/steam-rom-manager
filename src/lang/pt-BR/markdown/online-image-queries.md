# Consulta de imagem on-line `[suporta variáveis]`{.noWrap}

Consultas que são usadas para procurar imagens. Para definir a consulta de imagem, é necessário usar a seguinte sintaxe:

```
${...}
```

Por exemplo, imagens para "Legend of Zelda" e "The Legend of Zelda: A Link para os Passados" podem ser consultadas assim:

```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```

Você provavelmente vai querer usar variáveis do analisador para consultas. Que vai se parecer com isso (também o valor padrão de \*\*\*\*):

```
$${fuzzyTitle}
```

O modo legado **ganancioso** pode ser ativado definindo a consulta para:

```
${${fuzzyTitle}}${${title}}
```
