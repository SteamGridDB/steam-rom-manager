# Local images (optional) `[supports variables]`{.noWrap}

Allows to use images stored locally. A glob string is used to retrieve images. 

## How does it work?

Image paths are resolved in 3 step process:
1. All provided variables are replaced with their corresponding values.
1. New string is resolved against root directory (root directory is always a configuration's ROMs directory).
1. Final string is passed to glob parser which then returns a list of files, if they are available.

## Allowed image extensions

Only `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} and `TGA`{.noWrap} file extensions are supported. Even if parser finds files with other extensions, they are not included into the final list.

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

## Can you move the directory of local images after saving app list?

Yes, once the list is saved, local images are copied to a Steam directory where they are renamed to match Steam's APP ID.