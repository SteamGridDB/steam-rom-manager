# 用户账户（可选）

可以用于将配置限制为特定的用户帐户。 为了设置用户帐户，必须使用以下语法：
```
${...}
```
**如果**启用了[使用帐户凭据](#what-does-use-account-credentials-do)，则**必须**使用您在 Steam **登录** 时使用的用户名：

![账户示例](../../../assets/images/user-account-example.png) {.fitImage.center}

例如，这是您指定的“Banana”和“Apple”账户的方式：

```
${Banana}${Apple}
```

如果[使用帐户凭据](#what-does-use-account-credentials-do)被禁用，您仍然可以通过直接指定其 ID 来限制帐户：

```
${56489124}${21987424}
```

## “跳过找到的缺少数据目录的账户”是什么意思？

有时候，Steam 的包含登录信息的文件可能会包含未创建数据目录的用户（可能已被手动删除等）。 您可以启用此选项来跳过那些账户。

## “使用帐户凭据"是什么意思？

Tries to look for account credentials in Steam directory. In other words -- username. Username then can be used to filter accounts without actually having to know their ids. 换句话说 -- 用户名。 用户名可以用来过滤账户，而无需实际知道它们的 ID。

### 警告！

如果 Steam 禁用了凭据保存，这个选项将防止找到用户账户。
