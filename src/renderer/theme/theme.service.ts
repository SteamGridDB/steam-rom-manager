import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { CoreClientService } from "../services/core-client.service";
import { LoggerService } from "../services/logger.service";
import { ThemeDefinition, cssVar, tokenNames } from "./tokens";
import { appThemes, baseTokens, parseTheme } from "./themes";

export interface UserThemeFile {
  file: string;
  data?: unknown;
  error?: string;
}

// Applies themes: the base theme's tokens, overlaid with the chosen theme's,
// as CSS variables on <html>. App themes are built in (src/themes/default);
// user themes are JSON files in userData/themes/user, in the same format:
// { "name": "...", "colorScheme": "dark", "tokens": { ... } }.
@Injectable()
export class ThemeService {
  private userThemes = new BehaviorSubject<ThemeDefinition[]>([]);

  constructor(
    private coreClient: CoreClientService,
    private loggerService: LoggerService,
  ) {}

  get appThemeNames() {
    return appThemes.map((t) => t.name);
  }

  get userThemeNames() {
    return this.userThemes.getValue().map((t) => t.name);
  }

  get themeNames() {
    return [...this.appThemeNames, ...this.userThemeNames];
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
        : parseTheme(data, file);
      for (const problem of problems) {
        this.loggerService.error(`Theme ${file}: ${problem}`);
      }
      // (an app theme's name stays the app theme)
      if (theme && !this.appThemeNames.includes(theme.name)) {
        userThemes.push(theme);
      }
    }
    this.userThemes.next(userThemes);
  }

  // Applies a theme by name (unknown names: the default theme).
  apply(name: string) {
    const theme =
      [...appThemes, ...this.userThemes.getValue()].find(
        (t) => t.name === name,
      ) ?? appThemes[0];
    const root = document.documentElement;
    const values = { ...baseTokens, ...theme.tokens };
    for (const token of tokenNames) {
      root.style.setProperty(cssVar(token), values[token]);
    }
    root.style.colorScheme = theme.colorScheme;
    // The layout's rules (themes.global.scss) hang off this class.
    root.className = theme.layout;
    return theme.name;
  }
}
