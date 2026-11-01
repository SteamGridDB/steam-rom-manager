// The app's themes (always available). Each is a JSON file in default/, in
// the same format as a user theme: { name, colorScheme, tokens }. SRM also
// writes copies to userData/themes/default as examples to start from.
import deck from "./default/deck.json";
import classic from "./default/classic.json";
import emudeck from "./default/emudeck.json";
import sunset from "./default/sunset.json";
import solarizedDark from "./default/solarized-dark.json";
import solarizedLight from "./default/solarized-light.json";
import mint from "./default/mint.json";
import pride from "./default/pride.json";
import cyberpunk from "./default/cyberpunk.json";

// In the order Settings lists them; the first is the default theme.
export const defaultThemeFiles: Record<string, unknown> = {
  "deck.json": deck,
  "classic.json": classic,
  "emudeck.json": emudeck,
  "sunset.json": sunset,
  "solarized-dark.json": solarizedDark,
  "solarized-light.json": solarizedLight,
  "mint.json": mint,
  "pride.json": pride,
  "cyberpunk.json": cyberpunk,
};
