import { describe, expect, it } from "vitest";
import * as crc from "crc";
import { crc32 } from "../../src/lib/helpers/steam/crc32";

// App ids are derived from crc32(exe + appname); any difference from the
// "crc" package SRM used before would change every id (duplicates in Steam).
describe("crc32", () => {
  it("matches the crc package on ASCII, Unicode and odd strings", () => {
    const samples = [
      "",
      "123456789",
      '"C:EmulatorsRetroArch\retroarch.exe"Super Mario World (USA)',
      "/usr/bin/flatpak run org.libretro.RetroArch'Pokémon - Edición Rubí'",
      "ポケットモンスター 赤",
      "🎮 Melee Unlocked",
      "\u0000\u00ff\ud83d\ude00 mixed \t\n",
      "lone surrogate \ud800 end",
    ];
    let seed = 12345;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31);
    for (let i = 0; i < 500; i++) {
      const length = random() % 80;
      samples.push(
        String.fromCodePoint(
          ...Array.from({ length }, () => {
            const r = random();
            // mostly ASCII, some BMP and astral code points
            const cp =
              r % 10 < 7
                ? 32 + (r % 95)
                : r % 10 < 9
                  ? r % 0xd800
                  : 0x10000 + (r % 0xfffff);
            return cp;
          }),
        ),
      );
    }
    for (const sample of samples) {
      expect(crc32(sample), JSON.stringify(sample)).toBe(crc.crc32(sample));
    }
  });
});
