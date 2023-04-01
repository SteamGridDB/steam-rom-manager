# Contas de usuário (opcional)

Pode ser usado para limitar a configuração para contas de usuário específicas. Para definir a consulta de imagem, é necessário usar a seguinte sintaxe:
```
${...}
```
Você **deve** usar o nome de usuário que você usa para **entrar** no Steam **se** [usar credenciais de conta](#what-does-use-account-credentials-do) estiver ativado:

![Exemplo de conta](../../../assets/images/user-account-example.png) {.fitImage.center}

Por exemplo, é assim que você especifica grupos para "Rpcs3" e "rpcs3":

```
${Banana}${Apple}
```

No caso de [usar credenciais da conta](#what-does-use-account-credentials-do) está desativado, você ainda pode limitar as contas especificando seus Ids diretamente:

```
${56489124}${21987424}
```

## Ignorar contas encontradas com diretórios de dados ausentes?

Às vezes, o arquivo do Steam que contém logins, pode conter usuários que não possuem um diretório de dados criado (pode ter sido excluído manualmente, etc.). Você pode especificar para ignorar essas contas habilitando esta opção.

## O que faz "Usar as credenciais da conta"?

Tenta procurar credenciais de conta no diretório Steam. Em outras palavras -- nome de usuário. O nome de usuário pode ser usado para filtrar as contas sem ter que saber suas identidades.

### Aviso!

Se o Steam tiver as credenciais desativadas, esta opção impedirá de encontrar as contas de usuários.
