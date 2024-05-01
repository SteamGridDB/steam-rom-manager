# Glob-regex Parser Specific Inputs

## User's glob-regex

This is where you create your glob for extracting title from file path. Please read all of [special glob characters](#special-glob-characters) if you don't know how to construct a glob. 

## How does it work?

In addition to special glob characters, glob parser requires you to enter `${/.../}`{.noWrap} variable. Parser will locate it's position inside your glob, for example:

|User's glob|Position|
|---|---|
|`${/.+/}/*/*.txt`|First level from the left|
|`{*,*/*}/${/.+/}.txt`|First level from the right|
|`**/${/.+/}/*.txt`|Second level from the right|

After acquiring `${/.../}`{.noWrap} position, `${/.../}`{.noWrap} will be replaced with a wildcard `*`.

## Regex post-processing

After title extraction, title will be processed by a regular expression. There are 3 ways you can write a regular expression.

### Regular expression with no capture: `${/.+/}`{.noWrap}

This is practically identical to "Glob" parser -- every piece of extracted title will be used.

### Regular expression with capture brackets: `${/(.+)/}`{.noWrap}

Multiple matches and capture groups are allowed. For example, here we have 2 match groups with multiple capture groups:
```
${/(.*?)\s*\[USA\]\s*(.+)|(.*)/}
```
First match group (from left to right) with all correct captures will be used. Furthermore, all capture groups will be **joined**.

### Regular expression with capture brackets and replacement text: `${/(.+)/|...}`{.noWrap}

Similar to [regular expression with capture brackets](#regular-expression-with-capture-brackets) except for how it handles captured groups. Replacement text can be used to move around captured groups. For example:
```
${/(.*?)\s*\[USA\]\s*(.+)/|Second capture group: "$2" precedes the first one, which is "$1" }
```
If our first capture group is `Legend of Zelda` and second one is `SUPER EDITION`, then we will get the following (not very useful) title:

`Second capture group: "SUPER EDITION" precedes the first one, which is "Legend of Zelda"`

Untouched text will remain by default, so if you see some trailing characters be sure to add `.*` at the end or `.*?` at the begging of regular expression.

### Supported flags

Allowed flags are `i`, `g` and `u`.

## Limitations

Position extraction comes with some limitations -- glob is invalid if position can not be extracted. Most of the time you will be warned about what you can't do, however, if you find a combination that is allowed, but produces incorrect titles please make an issue at [github](https://github.com/FrogTheFrog/steam-rom-manager/issues).
