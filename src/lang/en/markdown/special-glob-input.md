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

### Matching either Fuzzy Title or Extracted Title

To grab images that match either extractedTitle or fuzzyTitle (or a constant default image name) a special syntax can be used:

Suppose you have `Luigi's Mansion (USA).iso` and thus have extractedTitle `Luigi's Mansion (USA)` and fuzzyTitle `Luigi's Mansion`. If we have a directory of artwork with:
```
(1) dir/Luigi's Mansion (USA).png
(2) dir/Luigi's Mansion.png
(3) dir/default.png
```
Then:

- `dir/$(${fuzzyTitle}|@(${title}))$.png` will match and retrieve images (1) and (2)
- `dir/$(${title}|@(${title}|default))$.png` will match and retrieve images (1) and (3)
- `dir/$(${fuzzyTitle}|@(${fuzzyTitle}|default))$.png` will match and retrieve images (2) and (3)
- `dir/$(${title}|@(${fuzzyTitle}|default))$.png` will match match and retrieve images (1) and (2) and (3)
