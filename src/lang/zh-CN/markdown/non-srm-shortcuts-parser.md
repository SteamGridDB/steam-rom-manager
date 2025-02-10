# 非SRM快捷方式解析器

This parser imports non SRM steam shortcuts into SRM so their artowrk can be managed. 它没有添加快捷方式，因此是一个 仅限artwork 解析器。 这个解析器需要用户账号字段被设置。

## User accounts

可以用于将配置限制为特定的用户帐户。 为了设置用户帐户，必须使用以下语法：

```
${...}
```

您**必须** 使用您使用的用户名**登录**到 Steam **如果** [使用帐户凭据](#what-do-do-use-account-crederals-do) 已启用：

![帐户示例](../../../assets/images/user-account-example.png) {.fitImage .center}

例如，这是您指定的 “Banana” 和 “Apple” 账户的方式：

```
${Banana}${Apple}
```

您也可以直接指定他们的 id 来限制帐户。 例如：

```
${56489124}${21987424}
```

搜索将限制为 `steam/userdata/56489124` 和 `steam/userdata/21987424` 。
