# 图像素材池 `[支持变量]`{.noWrap}

若该字段未填写，将默认使用 `${fuzzyTitle}`{.noWrap}。

该字段用于允许不同解析器的游戏在标题相同时共享同一批图片资源（即相同的“图片池”）。 如果你希望不同解析器对同名游戏不共享图片，只需将此字段设置为唯一值，例如 `${fuzzyTitle} SNES`{.noWrap} 或 `${fuzzyTitle} ${parserTitle}`{.noWrap}。
