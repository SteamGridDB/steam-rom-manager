# Default image `[supports variables]`{.noWrap}

Allows one to use an image, stored locally, as a default/fallback image. A [special glob input](#special-glob-input) string is used to retrieve images. Only the first retrieved image is used.

This image will be shown **only** if there are no other images available. Якщо зображення Steam доступне, ви зможете вибрати між Steam і цим зображенням.

## Дозволені розширення зображень

Підтримуються тільки файли розширень `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} та `TGA`{.noWrap}. Навіть якщо синтаксичний аналізатор знаходить файли з іншими розширеннями, вони не потрапляють до остаточного списку.

## Чи можна перемістити каталог типових зображень після збереження списку застосунків?

Так, після збереження списку типових зображень копіюються до каталогу Steam, де вони перейменовуються відповідно до APP ID у Steam.
