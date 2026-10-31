// Fuzzy titles decide app ids: a changed result for the same input would
// give users' existing games new shortcuts.
import { describe, expect, it } from "vitest";
import { FuzzyMatcher } from "../../src/lib/fuzzy-matcher";

const list = { totalGames: 3, games: ["Pokémon Snap", "Ōkami", "Brütal Legend"] };
const options = (replaceDiacritics: boolean) => ({
  replaceDiacritics,
  removeCharacters: true,
  removeBrackets: true,
});

describe("FuzzyMatcher", () => {
  it('"replace diacritics": matched titles come back without them (as always)', () => {
    const matcher = new FuzzyMatcher(undefined, list, {});
    expect(matcher.fuzzyMatchString("Pokemon Snap (USA)", options(true), false)).toBe("Pokemon Snap");
    expect(matcher.fuzzyMatchString("Okami", options(true), false)).toBe("Okami");
  });

  it("without it, the list's own title", () => {
    const matcher = new FuzzyMatcher(undefined, list, {});
    expect(
      matcher.fuzzyMatchString(
        "Pokémon Snap (USA)",
        { ...options(false), removeCharacters: false },
        false,
      ),
    ).toBe("Pokémon Snap");
  });
});
