# Analisador Steam

This parser imports steam games into SRM so you can manage their artwork. It does not add shortcuts, and as such is an `Artwork Only` parser. This parser requires the `User Accounts` field to be set.

## Limitações
Infelizmente, por enquanto, este analisador só funciona para jogos Steam **que estão em pelo menos uma categoria**. A razão para isso é que o Steam só armazena sua lista completa de jogos localmente se eles forem categorizados. Às vezes, por razões desconhecidas, os jogos serão armazenados localmente, independentemente do funcionamento do analisador. mas ser seguro, a coisa mais fácil de se fazer é apenas **criar uma categoria Steam** que tenha todas as suas partidas Steam dentro.

## User accounts (required)

Used to limit configuration to specific user accounts. Para definir a consulta de imagem, é necessário usar a seguinte sintaxe:
```
${...}
```
Você **deve** usar o nome de usuário que você usa para **entrar** no Steam **se** [usar credenciais de conta](#what-does-use-account-credentials-do) estiver ativado:

![Exemplo de conta](../../../assets/images/user-account-example.png) {.fitImage.center}

Por exemplo, é assim que você especifica grupos para "Rpcs3" e "rpcs3":

```
${Banana}${Apple}
```

You can also limit accounts by specifying their ids directly. For example:

```
${56489124}${21987424}
```
Would limit the search to `steam/userdata/56489124` and `steam/userdata/21987424`.

## Ignorar contas encontradas com diretórios de dados ausentes?

Às vezes, o arquivo do Steam que contém logins, pode conter usuários que não possuem um diretório de dados criado (pode ter sido excluído manualmente, etc.). Você pode especificar para ignorar essas contas habilitando esta opção.

## O que faz "Usar as credenciais da conta"?

Tenta procurar credenciais de conta no diretório Steam. Em outras palavras -- nome de usuário. O nome de usuário pode ser usado para filtrar as contas sem ter que saber suas identidades.

### Aviso!

Se o Steam tiver as credenciais desativadas, esta opção impedirá de encontrar as contas de usuários.
