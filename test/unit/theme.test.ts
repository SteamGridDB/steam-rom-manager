import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { tokenNames, tokens } from "../../src/renderer/theme/tokens";
import {
  appThemes,
  baseTokens,
  parseTheme,
} from "../../src/renderer/theme/themes";
import { defaultThemeFiles } from "../../src/themes";

const stylesDir = path.join(__dirname, "../../src/renderer/styles");
const sheets = fs
  .readdirSync(stylesDir)
  .filter((f) => f.endsWith(".scss"))
  .map((f) => ({
    file: f,
    text: fs.readFileSync(path.join(stylesDir, f), "utf8"),
  }));
const rendererDir = path.join(__dirname, "../../src/renderer");
const componentSources = fs
  .readdirSync(rendererDir, { recursive: true, encoding: "utf8" })
  .filter((f) => /\.(ts|html)$/.test(f))
  .map((f) => ({
    file: f,
    text: fs.readFileSync(path.join(rendererDir, f), "utf8"),
  }));
// (comments don't count)
const code = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("design tokens", () => {
  it("the base theme sets every token", () => {
    expect(Object.keys(baseTokens).sort()).toEqual([...tokenNames].sort());
  });

  it("the app themes (src/themes/default) load without problems", () => {
    for (const [file, data] of Object.entries(defaultThemeFiles)) {
      expect(parseTheme(data, file).problems, file).toEqual([]);
    }
    // Deck is the default; EmuDeck's name is relied on by its layout rules
    expect(appThemes.map((t) => t.name)).toEqual([
      "Deck",
      "Classic",
      "EmuDeck",
      "Sunset",
      "Solarized Dark",
      "Solarized Light",
      "Mint",
      "Pride",
      "Cyberpunk",
    ]);
  });

  it("stylesheets only use tokens that exist", () => {
    const unknown = sheets.flatMap(({ file, text }) =>
      [...code(text).matchAll(/var\(--srm-([\w-]+)/g)]
        .map((m) => m[1])
        .filter((name) => !(name in tokens))
        .map((name) => `${file}: --srm-${name}`),
    );
    expect(unknown).toEqual([]);
  });

  // (components' inline styles and templates use variables too)
  it("every other CSS variable the UI uses without a fallback is defined", () => {
    const sources = [...sheets, ...componentSources];
    const all = sources.map((s) => code(s.text)).join("\n");
    const defined = new Set(
      [...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
    );
    const undefinedVars = sources.flatMap(({ file, text }) =>
      [...code(text).matchAll(/var\(\s*(--[\w-]+)\s*\)/g)]
        .map((m) => m[1])
        // tokens are set at runtime; mixins build names from arguments
        .filter(
          (v) => !v.startsWith("--srm-") && !/-$/.test(v) && !defined.has(v),
        )
        .map((v) => `${file}: ${v}`),
    );
    expect([...new Set(undefinedVars)]).toEqual([]);
  });

  // Colors belong in themes (tokens). Count of hard-coded colors per
  // stylesheet: may only go down (the redesign brings these to zero).
  const allowedColors: Record<string, number> = {
    "logger.component.scss": 8,
    "markdown.component.scss": 15,
    "nav-link.component.scss": 1,
    "preview.component.scss": 2,
    "themes.global.scss": 18,
  };
  it("no new hard-coded colors outside the themes", () => {
    const counts = Object.fromEntries(
      sheets
        .map(({ file, text }) => [
          file,
          (code(text).match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g) ?? [])
            .length,
        ])
        .filter(([, n]) => n),
    );
    for (const [file, n] of Object.entries(counts)) {
      expect(n, `${file}: hard-coded colors (use tokens)`).toBeLessThanOrEqual(
        allowedColors[file] ?? 0,
      );
    }
  });
});

describe("user themes", () => {
  it("keeps known tokens with safe values; reports the rest", () => {
    const { theme, problems } = parseTheme(
      {
        name: "Sunset",
        colorScheme: "light",
        tokens: {
          accent: "#ff7a00",
          "--srm-radius-lg": "20px", // CSS variable names work too
          acent: "#000", // typo
          bg: "red; } body { display: none", // breaks out of the rule
          "bg-art": "url(https://example.com/x.png)", // loads something
          text: 42, // not a string
        },
      },
      "sunset.json",
    );
    expect(theme).toEqual({
      name: "Sunset",
      colorScheme: "light",
      layout: "Deck",
      tokens: { accent: "#ff7a00", "radius-lg": "20px" },
    });
    expect(problems).toEqual([
      'unknown token "acent"',
      'invalid value for "bg": "red; } body { display: none"',
      'invalid value for "bg-art": "url(https://example.com/x.png)"',
      'invalid value for "text": 42',
    ]);
  });

  it("picks a layout (default Deck); an unknown one is reported", () => {
    expect(parseTheme({ layout: "Classic" }, "a.json").theme.layout).toBe(
      "Classic",
    );
    const { theme, problems } = parseTheme({ layout: "Fancy" }, "b.json");
    expect(theme.layout).toBe("Deck");
    expect(problems).toEqual([
      'unknown layout "Fancy" (one of Deck, Classic, EmuDeck)',
    ]);
    // every app theme's layout is one themes.global.scss styles
    const scss = sheets.find((s) => s.file === "themes.global.scss").text;
    for (const theme of appThemes) {
      expect(scss, theme.name).toContain(`.${theme.layout} {`);
    }
  });

  it("is named after its file when it has no name; non-objects are refused", () => {
    expect(parseTheme({ tokens: {} }, "Mine.json").theme.name).toBe("Mine");
    expect(parseTheme("nope", "x.json")).toEqual({
      theme: null,
      problems: ["not a JSON object"],
    });
  });
});
