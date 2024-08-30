# 在线图像查询`[支持变量]`{.noWrap}

用于搜索图像的查询。 为了设置图像查询，必须使用以下语法：

```
${...}
```

例如，可以像这样查询 "Legend of Zelda" 和 "The Legend of Zelda: A Link to the Past" 的图像：

```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```

您很可能想要使用解析器变量来进行查询。 将会看起来像这样（也是**默认**值）：

```
${${fuzzyTitle}}
```

传统 **贪婪模式** 可以通过将查询设置为以下内容来启用：

```
${${fuzzyTitle}}${${title}}
```
