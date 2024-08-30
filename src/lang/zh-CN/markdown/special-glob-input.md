# 特殊 glob 输入

## 它是如何工作的？

图像路径的解析过程分为4个步骤：

1. 字符串被评估以确定是否使用基于通配符的解析器。 根据结果，进一步解析可能会使用`2`个全局集合。
1. 所有提供的变量都将被替换为它们对应的值。
1. 新的字符串已经根据根目录解决（根目录始终是配置 ROM 目录）
1. 最终的字符串被传递给全局解析器，然后返回可用文件列表。

## 用法示例

### 绝对路径

Let's say that the extracted title is `Metroid Fusion [USA]` and fuzzy title is `Metroid Fusion`. 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径： 然后，您可以像这样构建图像路径：

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
