# Epic Games 解析器

该解析器从 [Epic Games Store](https://store.epicgames.com/en-US/) 导入游戏，以便为它们选择艺术品并将其添加到 Steam 中。

如果不起作用，那是因为 Epic 已经改变了他们游戏清单的结构，在这种情况下，请让 SRM 的开发人员知道，我们会解决这个问题。

为了使此解析器与开源的 Epic 替代品 [Legendary](https://github.com/derrod/legendary) 兼容，[必须在 Legendary 中启用 EGL 同步](https://github.com/derrod/legendary/discussions/276#discussioncomment-709748)（这将创建适合解析器读取的文件，并不需要安装 `Epic Games Store`）。

话虽如此，SRM 中也有一个 `Legendary` 解析器，可以直接使用。

## 兼容性

该解析器目前仅在 `Windows` 和 `macOS` 系统上运行。 在 `macOS` 上，无法从 Epic Store 启动，因此切换应保持禁用状态。
