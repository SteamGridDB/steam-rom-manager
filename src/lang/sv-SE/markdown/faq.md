# Frequently asked questions

Read this if you're still having trouble with configuration. For most examples the following will be used unless specified otherwise:

|                    |                                            |
| ------------------ | ------------------------------------------ |
| **ROMs directory** | `C:/ROMs`                                  |
| **Fil1**           | `C:/ROMs/Kingdom Hearts/game.iso`          |
| **Fil2**           | `C:/ROMs/Kingdom Hearts II/rom.iso`        |
| **Fil3**           | `C:/ROMs/dir1/dir2/dir3/Metroid [USA].nes` |
| **Fil4**           | `C:/ROMs/dir1/dir2/dir3/save.sav`          |
| **Fil5**           | `C:/ROMs/dir1/dir2/Dragon Quest IV.NES`    |
| **Fil6**           | `C:/ROMs/dir1/dir2/save.sav`               |

## So, how do I setup user's glob?

First, let's analyze **File1**. Its full path is `C:/ROMs/Kingdom Hearts/game.iso`. Since our **ROMs directory** is `C:/ROMs`, we can just remove it from **File1**'s path.

We end up with `Kingdom Hearts/game.iso`. It obvious for us that `Kingdom Hearts` is the title, however parser is dumber than you -- you must specify path portion which contains the title by replacing `Kingdom Hearts` with `${title}`.

Again, we end up with `${title}/game.iso`, but we also want **File2**, because it is for the same emulator. **File1** is `game.iso` and **File2** is `rom.iso`. Vad händer nu?

Remember wild cards? They allow us to discard information that does not really matter. In this case we don't care if it is `game` or `rom`, we want both to be matched. That's why we replace them with `*`. This is the final glob for both **File1** and **File2**:

```
${title}/*.iso
```

Using similar logic we can produce glob for **File3**:

```
*/*/*/${title}.nes
```

## How to deal with multi-leveled directories?

This time we want **File3** and **File5** (both have different extensions, read next section on what to do about it as for now we will use `*` to ignore extension). Notice that **File3** has `3` subdirectories while  **File5** has `2`. Vad händer nu?

Now we can use a globstar and that's it!
```
**/${title}.*
```
Is it really that simple? **NO!** Globstar will have some impact in parser's performance if there are many subdirectories with thousands of files each. Globstar will make sure that parser check every file it can find. User once reported that parsing took ~10 minutes when he used globstars everywhere.

A recommended solution is to use braced sets. They can make multiple globs out of `1` glob. If we write a glob like this:

```
{*,*/*}/*/${title}.*
```

we will get `2` globs:

```
*/*/${title}.*
*/*/*/${title}.*
```

These `2` globs both satisfy our files, **File3** and **File5**.

## How to limit file extensions?

Let's say we use glob from previous example:

```
{*,*/*}/*/${title}.*
```

We will end up with 4 files: **File3**, **File4**, **File5** and **File6**. Now, we don't need **File4** and **File6**. Normally we could set glob to:

```
{*,*/*}/*/${title}.nes
```

but then we will end up only with **File3**, because `nes` is not equal to `NES` -- parser is case sensitive. There are two ways to solve this problem using extended glob matcher.

### Exclude `sav` extension

Extended glob matcher `!(...)` allows us to exclude stuff. Simply write glob like this:

```
{*,*/*}/*/${title}.!(sav)
```

and files with `sav` extension will be excluded.

### Check for multiple extensions

Extended glob matcher `@(...)` allows us to match multiple things. Simply write glob like this:

```
{*,*/*}/*/${title}.@(nes|NES)
```

and only files with `nes` and `NES` will be matched. If you're feeling fancy or if you have files with extensions `nes`, `NES`, `neS`, `nEs`, `Nes` and etc., you need a glob that uses character range:

```
{*,*/*}/*/${title}.@([nN][eE][sS])
```

Now parser can match any combination and is effectively case-insensitive. Technically, the following glob will work too, but the one above looks better.

```
{*,*/*}/*/${title}.[nN][eE][sS]
```

## Felsökning
* Please ensure that steam is actually closed before saving your app list.

* One common issue Steam ROM Manager runs into is the presence of old steam directories from people who logged into steam in your computer before the New Library Update. This can cause Steam ROM Manager to fail in unpredictable ways, as it tries to access directories whose structure has changed. In order to get around this, use the [User Accounts](#user-accounts) field to specify which accounts you actually want to use Steam ROM Manager with.

## The Discord

For further help, please see our [Discord](https://discord.gg/bnSVJrz).
