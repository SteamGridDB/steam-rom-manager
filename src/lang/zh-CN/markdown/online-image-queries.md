# Online image query `[supports variables]`{.noWrap}

Queries that are used to search for images. In order to set image query, the following syntax must be used:
```
${...}
```
For example, images for "Legend of Zelda" and "The Legend of Zelda: A Link to the Past" can be queried like this:
```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```
You will most likely want to use parser variables for queries. 将会看起来像这样（也是**默认**值）：
```
${${fuzzyTitle}}
```
**贪婪模式**可以通过将查询设置为以下内容来启用：
```
${${fuzzyTitle}}${${title}}
```
