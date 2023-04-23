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

You can also set accounts accounts by specifying their ids directly:

```
${56489124}${21987424}
```

The account id is the name of the account directory that appears in `/path/to/steam/userdata`.
