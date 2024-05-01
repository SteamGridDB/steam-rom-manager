# UPlay Parser Specific Inputs

## Ubisoft 目录覆盖
默认情况下，Steam ROM Manager 假定您的 UPlay 安装位于 `C:\Program Files (x86)\Ubisoft`。 如果你的 UPlay 安装在其他位置，这个字段允许你覆盖那个路径。

## 通过 UPlay 启动`[建议禁用]`
听起来像是，这个开关可以让你设置游戏是通过 UPlay 启动还是直接从游戏的可执行文件启动。

对于 UPlay 来说，这并不太重要，因为即使从可执行文件启动游戏，UPlay 游戏也会自动在后台启动 UPlay。 当启用`通过 UPlay 启动`时，Steam 覆盖层将无法工作，而当禁用 `通过 UPlay 启动` 时，Steam 和 Ubisoft 覆盖层都可以正常工作。
