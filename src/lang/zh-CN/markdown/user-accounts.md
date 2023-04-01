# 用户账户（可选）

可以用于将配置限制为特定的用户帐户。 为了设置用户帐户，必须使用以下语法：
```
${...}
```
**如果**启用了[使用帐户凭据](#what-does-use-account-credentials-do)，则**必须**使用您在 Steam **登录** 时使用的用户名：

![账户示例](../../../assets/images/user-account-example.png) {.fitImage.center}

For example, this is how you specify account for "Banana" and "Apple":

```
${Banana}${Apple}
```

In case the [use account credentials](#what-does-use-account-credentials-do) is disabled, you can still limit accounts by specifying their ids directly:

```
${56489124}${21987424}
```

## “跳过找到的缺少数据目录的账户”是什么意思？

有时候，Steam 的包含登录信息的文件可能会包含未创建数据目录的用户（可能已被手动删除等）。 您可以启用此选项来跳过那些账户。

## “使用帐户凭据"是什么意思？

Tries to look for account credentials in Steam directory. In other words -- username. Username then can be used to filter accounts without actually having to know their ids.

### Warning!

如果 Steam 禁用了凭据保存，这个选项将防止找到用户账户。
