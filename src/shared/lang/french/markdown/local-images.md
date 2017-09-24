# Images locales (facultatif) `[supports variables]`{.noWrap}

Permet d'utiliser des images stockées localement. Une chaîne globale est utilisée pour récupérer les images.

## Comment ça marche?

Les chemins d'images sont résolus en 3 étapes:
1. Toutes les variables fournies sont remplacées par leurs valeurs correspondantes.
1. Une nouvelle chaîne de caractères est résolue par rapport au répertoire racine (le répertoire racine est toujours le répertoire ROMs d'une configuration).
1. La chaîne finale est passée à l'analyseur globulaire qui retourne ensuite une liste de fichiers, s'ils sont disponibles.

## Extensions d'images autorisées

Seulement `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} et `TGA`{.noWrap} sont prises en charge. Même si l'analyseur trouve des fichiers avec d'autres extensions, ils ne sont pas inclus dans la liste finale.
## Exemple d'utilisation

### Chemins absolus

Supposons que le titre extrait est `Metroid Fusion [USA]` et le titre fuzzy est `Metroid Fusion`. Vous pouvez ensuite construire un chemin d'accès à l'image comme ceci:

- `C:/path/to/images/${title}.*`
- `C:/path/to/images/${fuzzyTitle}.*`

qui sera résolu ainsi:

- `C:/path/to/images/Metroid Fusion [USA].png`
- `C:/path/to/images/Metroid Fusion.jpg`

### Chemins relatifs

Pour cet exemple, disons que le répertoire des ROMs est `C:/ROMS/GBA` et la Rom elle-même est `C:/ROMS/GBA/Metroid Fusion [USA].gba`. Configurez un chemin relatif en utilisant `${filePath}`{.noWrap} ou `${dir}`{.noWrap} variables, par exemple:

- `${filePath}/../../../path/to/images/${title}.*`
- `${dir}/../../path/to/images/${title}.*`

sera remplacé comme ceci:

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

## Pouvez-vous déplacer le répertoire des images locales après avoir sauvegardé la liste des applications?

Oui, une fois la liste sauvegardée, les images locales sont copiées dans un répertoire Steam où elles sont renommées pour correspondre à l'ID APP de Steam.
