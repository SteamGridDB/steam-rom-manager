# Онлайн-запрос изображений `[поддерживает переменные]`{.noWrap}

Запросы, используемые для поиска изображений. In order to set image query, the following syntax must be used:
```
${...}
```
For example, images for "Legend of Zelda" and "The Legend of Zelda: A Link to the Past" can be queried like this:
```
${The Legend of Zelda}${The Legend of Zelda: A Link to the Past}
```
You will most likely want to use parser variables for queries. Which will look like this (also the **default** value):
```
${${fuzzyTitle}}
```
The legacy **greedy** mode can be enabled by setting query to:
```
${${fuzzyTitle}}${${title}}
```
