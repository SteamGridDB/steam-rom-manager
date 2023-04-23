# 用户账户（可选）

可以用于将配置限制为特定的用户帐户。 为了设置用户帐户，必须使用以下语法：
```
${...}
```
**如果** 启用了 [使用帐户凭据](#what-does-use-account-credentials-do)，则 **必须** 使用您在 Steam **登录** 时使用的用户名：

![账户示例](../../../assets/images/user-account-example.png) {.fitImage.center}

例如，这是您指定的 “Banana” 和 “Apple” 账户的方式：

```
${Banana}${Apple}
```

You can also set accounts accounts by specifying their ids directly:

```
${56489124}${21987424}
```

The account id is the name of the account directory that appears in `/path/to/steam/userdata`.
