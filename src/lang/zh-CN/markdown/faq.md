# Frequently asked questions

Read this if you're still having trouble with configuration. For most examples the following will be used unless specified otherwise: For most examples the following will be used unless specified otherwise:

|                    |                                            |
| ------------------ | ------------------------------------------ |
| **ROMs directory** | `C:/ROMs`                                  |
| **File1**          | `C:/ROMs/Kingdom Hearts/game.iso`          |
| **File2**          | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **File3**          | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **File4**          | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **File5**          | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **File6**          | `C:/ROMs/dir1/dir2/save.sav`               |

## So, how do I setup user's glob?

First, let's analyze **File1**. Its full path is `C:/ROMs/Kingdom Hearts/game.iso`. First, let's analyze **File1**. Its full path is `C:/ROMs/Kingdom Hearts/game.iso`. Since our **ROMs directory** is `C:/ROMs`, we can just remove it from **File1**'s path.

We end up with `Kingdom Hearts/game.iso`. We end up with `Kingdom Hearts/game.iso`. It obvious for us that `Kingdom Hearts` is the title, however parser is dumber than you -- you must specify path portion which contains the title by replacing `Kingdom Hearts` with `${title}`.

Again, we end up with `${title}/game.iso`, but we also want **File2**, because it is for the same emulator. **File1** is `game.iso` and **File2** is `rom.iso`. What now? **File1** is `game.iso` and **File2** is `rom.iso`. What now?

Remember wild cards? They allow us to discard information that does not really matter. In this case we don't care if it is `game` or `rom`, we want both to be matched. That's why we replace them with `*`. This is the final glob for both **File1** and **File2**:

```
${title}/*.iso
```

Using similar logic we can produce glob for **File3**:

```
*/*/*/${title}.nes
```

## How to deal with multi-leveled directories?

This time we want **File3** and **File5** (both have different extensions, read next section on what to do about it as for now we will use `*` to ignore extension). Notice that **File3** has `3` subdirectories while  **File5** has `2`. What now? Notice that **File3** has `3` subdirectories while  **File5** has `2`. What now?

Now we can use a globstar and that's it!
```
**/${title}.*
```
Is it really that simple? Is it really that simple? **NO!** Globstar will have some impact in parser's performance if there are many subdirectories with thousands of files each. Globstar will make sure that parser check every file it can find. User once reported that parsing took ~10 minutes when he used globstars everywhere. Globstar will make sure that parser check every file it can find. User once reported that parsing took ~10 minutes when he used globstars everywhere.

A recommended solution is to use braced sets. A recommended solution is to use braced sets. They can make multiple globs out of `1` glob. If we write a glob like this: If we write a glob like this:

```
{*,*/*}/*/${title}.*
```

we will get `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

这`2`个blob都符合我们的文件，**File3**和**File5**。

## 如何限制文件扩展名？

假设我们使用前面例子中的 glob：

```
{*,*/*}/*/${title}.*
```

我们最终会得到4个文件：**File3**、**File4**、**File5**和**File6**。 现在，我们不需要**文件4**和**文件6**。 通常我们可以将 glob 设置为：

```
{*,*/*}/*/${title}.nes
```

但是最终我们只会得到**File3**，因为`nes`不等于`NES`--解析器区分大小写。 使用扩展的 glob 匹配器，有两种方法可以解决这个问题。

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

只有带有`nes`和`NES`的文件才会匹配。 如果你感觉很高级，或者你有扩展名为`nes`, `NES`, `neS`, `nEs`, `Nes`等的文件，那么你需要使用字符范围的通配符：

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

现在解析器可以匹配任何组合，并且是有效的不区分大小写。 从技术上讲，下面的通配符也可以工作，但是上面那个看起来更好。

```
{*,*/*}/*/${title}.[nN][eE][sS]
```

## 故障处理
* 请确保在保存应用程序列表之前， Steam 已经完全关闭。

* Steam ROM Manager 经常遇到的一个问题是，在新库更新之前，曾经在您的计算机上登录过 Steam 的人留下了旧的 steam 目录。 这可能会导致 Steam ROM Manager 以不可预测的方式失败，因为它试图访问目录结构已更改的目录。 为了解决这个问题，请使用“[用户账户](#user-accounts)”字段来指定您实际想要使用 Steam ROM Manager 的帐户。

## Discord

如需进一步帮助，请查看我们的[Discord](https://discord.gg/bnSVJrz)。
