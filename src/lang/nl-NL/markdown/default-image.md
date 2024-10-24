# Default image `[supports variables]`{.noWrap}

Hiermee kan een lokaal opgeslagen afbeelding worden gebruikt als standaard-/terugvalafbeelding. Een [special glob input](#special-glob-input) string wordt gebruikt om afbeeldingen op te halen. Alleen de eerste opgehaalde afbeelding wordt gebruikt.

Deze afbeelding wordt **alleen** getoond als er geen andere afbeeldingen beschikbaar zijn. Als Steam-afbeelding beschikbaar is, kan je kiezen uit Steam en deze afbeelding.

## Toegestane afbeeldingsformaten

Alleen `JPEG`{.noWrap}, `JPG`{.noWrap}, `PNG`{.noWrap} en `TGA`{.noWrap} bestandsextensies worden ondersteund. Zelfs als de parser bestanden met andere extensies vindt, worden ze niet opgenomen in de definitieve lijst.

## Kun je de map van de standaard afbeelding verplaatsen na het opslaan van de app-lijst?

Ja, zodra de lijst is opgeslagen, wordt de standaardafbeelding gekopieerd naar een Steam-directory en hernoemd om overeen te komen met de APP-ID van Steam.
