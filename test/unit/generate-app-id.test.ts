import { describe, expect, it } from "vitest";
import {
  appifyShortcutId,
  generateAppId,
  generateShortAppId,
  generateShortcutId,
  lengthenAppId,
  shortcutifyAppId,
  shortenAppId,
} from "../../src/lib/helpers/steam/generate-app-id";

// Anchor on the published CRC-32 check value: crc32("123456789") = 0xCBF43926.
// Its high bit is already set, so the "top" half is the CRC itself.
const CHECK_CRC = 0xcbf43926n;
const checkLong = String((CHECK_CRC << 32n) | 0x02000000n);
const checkShort = String(CHECK_CRC);
const checkShortcut = Number(CHECK_CRC - 0x100000000n);

describe("generate-app-id", () => {
  it("derives the long app id from crc32(exe + appname)", () => {
    expect(generateAppId("", "123456789")).toBe(checkLong);
    // exe and appname are simply concatenated
    expect(generateAppId("1234", "56789")).toBe(checkLong);
  });

  it("derives the short (grid) and shortcuts.vdf ids", () => {
    expect(generateShortAppId("", "123456789")).toBe(checkShort);
    expect(generateShortcutId("", "123456789")).toBe(checkShortcut);
    expect(checkShortcut).toBe(-873187034);
  });

  it("always sets the high bit of the short id", () => {
    for (const [exe, name] of [
      ['"C:\\Emu\\emu.exe"', "Some Game"],
      ["/usr/bin/retroarch", "Another Game"],
      ["", ""],
    ]) {
      const short = BigInt(generateShortAppId(exe, name));
      expect(short >= 0x80000000n && short <= 0xffffffffn).toBe(true);
      expect(generateShortcutId(exe, name)).toBeLessThan(0);
    }
  });

  it("converts between the id forms losslessly", () => {
    for (const [exe, name] of [
      ['"C:\\Emu\\emu.exe"', "Some Game"],
      ["/usr/bin/retroarch", "Ünïcödé Gämé ✨"],
    ]) {
      const long = generateAppId(exe, name);
      const short = shortenAppId(long);
      const shortcut = generateShortcutId(exe, name);
      expect(lengthenAppId(short)).toBe(long);
      expect(shortcutifyAppId(long)).toBe(shortcut);
      expect(appifyShortcutId(shortcut)).toBe(long);
    }
  });

  it("shortcutifyAppId is the signed 32-bit view of the short id", () => {
    // `>> 32` is a ToInt32 no-op in JS; this pins that subtle behaviour.
    expect(shortcutifyAppId(checkLong)).toBe(checkShortcut);
    expect(String(shortcutifyAppId(checkLong))).not.toBe(
      shortenAppId(checkLong),
    );
  });
});
