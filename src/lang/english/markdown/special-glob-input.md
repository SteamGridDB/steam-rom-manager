# Special glob input

## How does it work?

Image paths are resolved in 4 step process:
1. String is evaluated to see if a glob based parser is used. Depending on the result, further parsing may continue with `2` glob sets.
1. All provided variables are replaced with their corresponding values.
1. New string(s) is/are resolved against root directory (root directory is always a configuration's ROMs directory).
1. Final string(s) is/are passed to glob parser which then returns a list of available files.

## Usage example

### Absolute paths

Let's say that the extracted title is `Metroid Fusion [USA]` and fuzzy title is `Metroid Fusion`. You can then construct an image path like this:

- `C:/path/to/images/${title}.*`
- `C:/path/to/images/${fuzzyTitle}.*`

which will be resolved to this:

- `C:/path/to/images/Metroid Fusion [USA].png`
- `C:/path/to/images/Metroid Fusion.jpg`

### Relative paths

For this example, let's say that ROMs directory is `C:/ROMS/GBA` and rom itself is `C:/ROMS/GBA/Metroid Fusion [USA].gba`. Set up a relative path, using `${filePath}`{.noWrap} or `${dir}`{.noWrap} variables, for example:

- `${filePath}/../../../path/to/images/${title}.*`
- `${dir}/../../path/to/images/${title}.*`

will be replaced like this:

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../path/to/images/Metroid Fusion.*`
- `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`

Here `..` means "traverse back" and it allows to go back to previous directory:

- `C:/ROMS/GBA/Metroid Fusion [USA].gba/../../../path/to/images/Metroid Fusion.*`
  - `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`
    - `C:/ROMS/../path/to/images/Metroid Fusion.*`
      - `C:/path/to/images/Metroid Fusion.*`
- `C:/ROMS/GBA/../../path/to/images/Metroid Fusion.*`
  - `C:/ROMS/../path/to/images/Metroid Fusion.*`
    - `C:/path/to/images/Metroid Fusion.*`

### Adding parser support

To enable parser support you need to use a special syntax:

```
$(parser variable|secondary value [optional])$
```

Here parser variable must be either `${title}` (belongs to Glob parser) or `${/.../}` (belongs to Glob-regex parser).

Secondary value is optional and can be anything you would use in a special glob input without parser support. For example, this is how you could write special syntax without secondary value:

```
${dir}/../../path/to/images/$(${title})$.png
```

and this is how you write  with secondary value:

```
${dir}/../../path/to/images/$(${title}|@(${title}|default))$.png
```

Second example will result in `2` glob sets:

- `${dir}/../../path/to/images/${title}.png`
- `${dir}/../../path/to/images/@(Metroid Fusion [USA]|default).png`

If fuzzy matching is enabled, a special equality check will be made. Parser will check if any of the titles from `${dir}/../../path/to/images/${title}.png` glob matches current file's fuzzy title. Matched files will be used. 
