# Steam 解析器

This parser imports steam games into SRM so you can manage their artwork. It does not add shortcuts, and as such is an `Artwork Only` parser. This parser requires the `User Accounts` field to be set.

## 限制
很遗憾，目前这个解析器只适用于至少属于一个类别的 Steam 游戏。 这是因为如果游戏被分类，Steam 才会在本地存储您的完整游戏列表。 有时候，由于未知原因，游戏会被本地存储并且解析器可以正常工作，但为了安全起见，最简单的方法就是 **创建一个 Steam 游戏分类** 将所有 Steam 游戏放入其中。

## User accounts (required)

Used to limit configuration to specific user accounts. 为了设置用户帐户，必须使用以下语法：
```
${...}
```
如果启用了“使用帐户凭据”，则必须使用您在 Steam 登录时使用的用户名：

![账户示例](../../../assets/images/user-account-example.png) {.fitImage.center}

例如，这是您指定的 “Banana” 和 “Apple” 账户的方式：

```
${Banana}${Apple}
```

You can also limit accounts by specifying their ids directly. For example:

```
${56489124}${21987424}
```
Would limit the search to `steam/userdata/56489124` and `steam/userdata/21987424`.

## “跳过找到的缺少数据目录的账户”是什么意思？

有时候，Steam 的包含登录信息的文件可能会包含未创建数据目录的用户（可能已被手动删除等）。 您可以启用此选项来跳过那些账户。

## “使用帐户凭据"是什么意思？

尝试在 Steam 目录中查找帐户凭据。 换句话说 -- 用户名。 用户名可以用来过滤账户，而无需实际知道它们的 ID。

### 警告！

如果 Steam 禁用了凭据保存，这个选项将防止找到用户账户。
