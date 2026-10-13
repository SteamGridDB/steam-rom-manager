import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "../services/core-client.service";
import { LoggerService } from "../services/logger.service";
import {
  ThemeDefinition,
  ThemeTokens,
  TokenKind,
  TokenName,
  cssVar,
  tokenNames,
  tokens,
} from "./tokens";
import { baseTokens, builtInThemes } from "./themes";

// The property a value of each kind must be valid for (checked with
// CSS.supports, so anything the browser wouldn't accept is ignored).
const propertyFor: Record<TokenKind, string> = {
  color: "color",
  paint: "background-image",
  shadow: "box-shadow",
  length: "width",
  number: "line-height",
  font: "font-family",
  time: "transition-duration",
  easing: "transition-timing-function",
};

// User themes may not load anything: no urls, imports or rule breakers.
const unsafe = /url\(|@import|expression\(|[;{}<>\\]/i;

export interface UserThemeFile {
  file: string;
  data?: unknown;
  error?: string;
}

// Applies themes: the base theme's tokens, overlaid with the chosen theme's,
// as CSS variables on <html>. User themes are JSON files in "User themes"
// (userData): { "name": "...", "colorScheme": "dark", "tokens": { ... } }.
@Injectable()
export class ThemeService {
  private themes = new BehaviorSubject<ThemeDefinition[]>(builtInThemes);

  constructor(
    private coreClient: CoreClientService,
    private loggerService: LoggerService,
  ) {}

  get available() {
    return this.themes.asObservable();
  }

  get themeNames() {
    return this.themes.getValue().map((t) => t.name);
  }

  // Reads the user themes (call before applying a user theme).
  async loadUserThemes() {
    const files: UserThemeFile[] = await this.coreClient.client
      .call("support", "userThemes")
      .catch(() => []);
    const userThemes: ThemeDefinition[] = [];
    for (const { file, data, error } of files) {
      const { theme, problems } = error
        ? { theme: null, problems: [error] }
        : ThemeService.parse(data, file);
      for (const problem of problems) {
        this.loggerService.error(`Theme ${file}: ${problem}`);
      }
      if (theme && !builtInThemes.some((b) => b.name === theme.name)) {
        userThemes.push(theme);
      }
    }
    this.themes.next([...builtInThemes, ...userThemes]);
  }

  // A user theme from its JSON: unknown tokens and invalid values are left
  // out (reported in `problems`); the base theme fills in the rest.
  static parse(
    data: unknown,
    file: string,
  ): { theme: ThemeDefinition | null; problems: string[] } {
    const problems: string[] = [];
    const raw = data as {
      name?: unknown;
      colorScheme?: unknown;
      tokens?: unknown;
    };
    if (!raw || typeof raw !== "object") {
      return { theme: null, problems: ["not a JSON object"] };
    }
    const name =
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : file.replace(/\.json$/i, "");
    const values: ThemeTokens = {};
    const given =
      raw.tokens && typeof raw.tokens === "object"
        ? (raw.tokens as Record<string, unknown>)
        : {};
    for (const [key, value] of Object.entries(given)) {
      const token = key.replace(/^--srm-/, "") as TokenName;
      if (!(token in tokens)) {
        problems.push(`unknown token "${key}"`);
      } else if (
        typeof value !== "string" ||
        !ThemeService.isValid(token, value)
      ) {
        problems.push(`invalid value for "${key}": ${JSON.stringify(value)}`);
      } else {
        values[token] = value;
      }
    }
    return {
      theme: {
        name,
        colorScheme: raw.colorScheme === "light" ? "light" : "dark",
        tokens: values,
      },
      problems,
    };
  }

  static isValid(token: TokenName, value: string) {
    if (unsafe.test(value)) return false;
    const property = propertyFor[tokens[token].kind];
    return (
      value === "none" ||
      typeof CSS === "undefined" || // (tests)
      CSS.supports(property, value)
    );
  }

  // Applies a theme by name (unknown names: the default theme).
  apply(name: string) {
    const theme =
      this.themes.getValue().find((t) => t.name === name) ?? builtInThemes[0];
    const root = document.documentElement;
    const values = { ...baseTokens, ...theme.tokens };
    for (const token of tokenNames) {
      root.style.setProperty(cssVar(token), values[token]);
    }
    root.style.colorScheme = theme.colorScheme;
    // Theme-specific layout rules (e.g. EmuDeck's) hang off this class.
    root.className = theme.name.replace(/[^\w-]/g, "");
    return theme.name;
  }
}
