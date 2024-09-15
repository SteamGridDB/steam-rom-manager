# Título da variável personalizada)

Permite substituir o título extraído com uma variável personalizada. Isso é feito logo após a extração do título, o que significa que o título substituído pode ser usado para correspondência incerta e assim por diante. Grupos e variáveis em si são **sensíveis a maiúsculas e minúsculas**, a não ser que uma opção de variável insesitiva esteja habilitada.

Correspondência de título pode ser limitada a grupos específicos de variáveis personalizadas. Para definir a consulta de imagem, é necessário usar a seguinte sintaxe:

```
${...}
```

Por exemplo, é assim que você especifica grupos para "RPCS3" e "rpcs3":

```
${RPCS3}${rpcs3}
```

Certifique-se de **ativar a opção**.

## Opção insensível

Se esta opção estiver habilitada, a correspondência insensível a maiúsculas e minúsculas será feita e a primeira variável personalizada correspondente será usada.

## Notas. Este recurso é **experimental**

Basicamente, ele pode mudar no lançamento futuro (muito improvavelmente). Além disso, atualmente a única maneira de adicionar variáveis é criar/editar `customVariables.json` usado diretamente pelo SRM.

Este arquivo é/shoud localizado no diretório `userData` da SRM.

SRM irá lançar erro a menos que a seguinte estrutura JSON seja usada:

```
{
    "RPCS3": {
        "NPUB30698": "Catherine",
        "NPUB30024": "1942: Golpe Conto",
...
    },
    "Custom Stuff": {
        "The Legend Of Zelda": "The Legend of Link"
    },
...
}
```

Então se o seu usuário glob era `MyDir/${title}.wad` e você tinha um `Legend de Zelda. anúncio` localizado em `MyDir`, você definiria o título do campo de variável personalizada para `${Custom Stuff}` para obter um título final de "A Legenda do Link".
