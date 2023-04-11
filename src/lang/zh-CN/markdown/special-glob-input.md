# 特殊 glob 输入

## 它是如何工作的？

图像路径的解析过程分为4个步骤：
1. 字符串被评估以确定是否使用基于通配符的解析器。 根据结果，进一步解析可能会使用`2`个全局集合。
1. 所有提供的变量都将被替换为它们对应的值。
1. 新的字符串已经根据根目录解决（根目录始终是配置 ROM 目录）
1. 最终的字符串被传递给全局解析器，然后返回可用文件列表。

## 用法示例

### 绝对路径

Let's say that the extracted title is `Metroid Fusion [USA]` and fuzzy title is `Metroid Fusion`. 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径：

- `C:/path/to/images/${title}.*`
- `C:/path/to/images/${fuzzyTitle}.*`

这将被解析为：

- `C:/path/to/images/Metroid Fusion [USA].png`
- `C:/path/to/images/Metroid Fusion.jpg`

### 相对路径

For this example, let's say that ROMs directory is `C:/ROMS/GBA` and rom itself is `C:/ROMS/GBA/Metroid Fusion [USA].gba`. Set up a relative path, using `${filePath}`{.noWrap} or `${dir}`{.noWrap} variables, for example: 设置相对路径，使用 `${filePath}`{.noWrap} 或 `${dir}`{.noWrap} 变量，例如： 设置相对路径，使用 `${filePath}`{.noWrap} 或 `${dir}`{.noWrap} 变量，例如： 设置相对路径，使用 `${filePath}`{.noWrap} 或 `${dir}`{.noWrap} 变量，例如： 设置相对路径，使用 `${filePath}`{.noWrap} 或 `${dir}`{.noWrap} 变量，例如： 设置相对路径，使用 `${filePath}`{.noWrap} 或 `${dir}`{.noWrap} 变量，例如： 设置相对路径，使用 `${filePath}`{.noWrap} 或 `${dir}`{.noWrap} 变量，例如：

- `${filePath}/../../../path/to/images/${title}.*`
- `${dir}/../../path/to/images/${title}.*`

将会被替换成这样：

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../path/to/images/Metroid Fusion.*`
- `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`

这里的 `..` 表示“返回”，它允许回到上一个目录：

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../path/to/images/Metroid Fusion.*`
  - `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`
    - `C:/ROMS/../path/to/images/Metroid Fusion.*`
      - `C:/path/to/images/Metroid Fusion.*`
- `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`
  - `C:/ROMS/../path/to/images/Metroid Fusion.*`
    - `C:/path/to/images/Metroid Fusion.*`

### 匹配模糊标题或提取的标题

为了获取与提取的标题（extractedTitle）或模糊标题（fuzzyTitle）匹配的图像（或常量默认图像名称），可以使用特殊语法：

假设你有 `Luigi's Mansion (USA).iso`，因此提取了标题 `Luigi's Mansion (USA)` 和模糊标题 `Luigi's Mansion`。 如果我们有一份艺术作品目录，其中包括：
```
(1) dir/Luigi's Mansion (USA).png
(2) dir/Luigi's Mansion.png
(3) dir/default.png
```
然后：

- `dir/$(${fuzzyTitle}|@(${title}))$.png` 将匹配并检索图像 (1) 和 (2)
- `dir/$(${title}|@(${title}|default))$.png`" 将匹配并检索图像（1）和（3）。
- `dir/$(${fuzzyTitle}|@(${fuzzyTitle}|default))$.png`" 将匹配并检索图像 (2) 和 (3)。
- `dir/$(${title}|@(${fuzzyTitle}|default))$.png`" 将匹配并检索图像 (1)、(2) 和 (3)。
