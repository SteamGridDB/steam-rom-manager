# 常见问题

Read this if you're still having trouble with configuration. For most examples the following will be used unless specified otherwise: Read this if you're still having trouble with configuration. For most examples the following will be used unless specified otherwise: For most examples the following will be used unless specified otherwise: 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容： 除非另有说明，否则大多数情况下将使用以下内容：

|              |                                            |
| ------------ | ------------------------------------------ |
| **ROM 目录** | `C:/ROMs`                                  |
| **File1**    | `C:/ROMs/Kingdom Hearts/game.iso`          |
| **File2**    | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **File3**    | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **File4**    | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **File5**    | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **File6**    | `C:/ROMs/dir1/dir2/save.sav`               |

## 那么，我该如何设置用户的全局变量？

首先，让我们分析 **File1**。 它的完整路径是 `C:/ROMs/Kingdom Hearts/game.iso`。 由于我们的 **ROMs目录** 位于 `C:/ROMs`，因此我们可以从 **File1** 的路径中删除它。

我们最终得到了 `Kingdom Hearts/game.iso`。 对我们来说，`Kingdom Hearts` 是标题很明显，但解析器比你还要笨 -- 你必须用 `${title}` 替换 `Kingdom Hearts` 以指定包含标题的路径部分。

再次强调，我们得到了 `${title}/game.iso`，但是我们也需要 **File2**，因为它适用于同一个模拟器。 Again, we end up with `${title}/game.iso`, but we also want **File2**, because it is for the same emulator. **File1** is `game.iso` and **File2** is `rom.iso`. What now? **File1** is `game.iso` and **File2** is `rom.iso`. What now? **File1** is `game.iso` and **File2** is `rom.iso`. 现在怎么办？ 现在怎么办？

还记得通配符吗？ 它们允许我们丢弃那些并不重要的信息。 在这种情况下，我们不关心它是`游戏`还是`ROM`，我们希望两者都匹配。 那就是为什么我们用 `*` 替换它们。 这是 **File1** 和 **File2** 的最终结果：

```
${title}/*.iso
```

使用类似的逻辑，我们可以为 **File3** 生成全局变量：

```
*/*/*/${title}.nes
```

## 如何处理多层目录？

This time we want **File3** and **File5** (both have different extensions, read next section on what to do about it as for now we will use `*` to ignore extension). Notice that **File3** has `3` subdirectories while **File5** has `2`. What now? Notice that **File3** has `3` subdirectories while **File5** has `2`. What now? 请注意，**File3**有`3`个子目录，而**File5**有`2`个。 请注意，**File3** 有 `3` 个子目录，而 **File5** 有 `2` 个。 现在怎么办？

现在我们可以使用 globstar，就是这样！

```
**/${title}.*
```

它真的那么简单吗？ Is it really that simple? Is it really that simple? **NO!** Globstar will have some impact in parser's performance if there are many subdirectories with thousands of files each. Globstar will make sure that parser check every file it can find. User once reported that parsing took ~10 minutes when he used globstars everywhere. Globstar will make sure that parser check every file it can find. User once reported that parsing took ~10 minutes when he used globstars everywhere. Globstar 会确保解析器检查它能找到的每个文件。 Globstar 会确保解析器检查它能找到的每个文件。 用户曾经报告过解析需要约10分钟的时间来使用 globstar。

建议的解决方案是使用花括号集合。 A recommended solution is to use braced sets. A recommended solution is to use braced sets. They can make multiple globs out of `1` glob. If we write a glob like this: If we write a glob like this: 如果我们像这样写一个全局通配符： 如果我们像这样写一个全局通配符：

```
{*,*/*}/*/${title}.*
```

我们将获得 `2` 个 globs：

```
*/*/${title}.*
*/*/*/${title}.*
```

这 `2` 个 globs 都符合我们的文件，**File3** 和 **File5**。

## 如何限制文件扩展名？

假设我们使用前面例子中的 glob：

```
{*,*/*}/*/${title}.*
```

我们最终会得到4个文件：**File3**、**File4**、**File5** 和 **File6**。 现在，我们不需要 **File4** 和 **File6**。 通常我们可以将 glob 设置为：

```
{*,*/*}/*/${title}.nes
```

但是最终我们只会得到 **File3**，因为 `nes` 不等于 `NES` -- 解析器区分大小写。 使用扩展的 glob 匹配器，有两种方法可以解决这个问题。

### 排除 `sav` 扩展名

扩展的 glob 匹配器 `!(...)` 允许我们排除一些东西。 像这样简单地编写 glob：

```
{*,*/*}/*/${title}.!(sav)
```

具有 `sav` 扩展名的文件将被排除在外。

### 检查多个扩展名

扩展的 glob 匹配器 `@(...)` 允许我们匹配多个内容。 像这样简单地编写 glob：

```
{*,*/*}/*/${title}.@(nes|NES)
```

只有带有 `nes` 和 `NES` 的文件才会匹配。 如果你感觉很炫酷，或者你有扩展名为 `nes`, `NES`, `neS`, `nEs`, `Nes` 等的文件，那么你需要使用字符范围的通配符：

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

现在解析器可以匹配任何组合，并且是有效的不区分大小写。 从技术上讲，下面的通配符也可以工作，但是上面那个看起来更好。

```
{*,*/*}/*/${title}.[nN][eE][sS]
```

## 故障处理

- 请确保在保存应用程序列表之前， Steam 已经完全关闭。

- Steam ROM Manager 经常遇到的一个问题是，在新库更新之前，曾经在您的计算机上登录过 Steam 的人留下了旧的 steam 目录。 这可能会导致 Steam ROM Manager 以不可预测的方式失败，因为它试图访问目录结构已更改的目录。 为了解决这个问题，请使用“[用户账户](#user-accounts)”字段来指定您实际想要使用 Steam ROM Manager 的帐户。

## Discord

如需进一步帮助，请查看我们的 [Discord](https://discord.gg/bnSVJrz)。
