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

// A user theme and the file it's saved in (themes/user/<file>).
export interface UserTheme {
  theme: ThemeDefinition;
  file: string;
}

// Applies themes: the base theme's tokens, overlaid with the chosen theme's,
// as CSS variables on <html>. App themes are built in (src/themes/default);
// user themes are JSON files in userData/themes/user, in the same format:
// { "name": "...", "colorScheme": "dark", "tokens": { ... } }.
@Injectable()
export class ThemeService {
  private userThemes = new BehaviorSubject<UserTheme[]>([]);
  // Problems already logged (themes are re-read often).
  private reported = new Set<string>();

  constructor(
    private coreClient: CoreClientService,
    private loggerService: LoggerService,
  ) {}

  get appThemes() {
    return appThemes;
  }

  get appThemeNames() {
    return appThemes.map((t) => t.name);
  }

  get userThemeList() {
    return this.userThemes.getValue();
  }

  get userThemeNames() {
    return this.userThemeList.map((t) => t.theme.name);
  }

  get themeNames() {
    return [...this.appThemeNames, ...this.userThemeNames];
  }

  find(name: string): ThemeDefinition | undefined {
    return [...appThemes, ...this.userThemeList.map((u) => u.theme)].find(
      (t) => t.name === name,
    );
  }

  // Reads the user themes (call before applying a user theme).
  async loadUserThemes() {
    const files: UserThemeFile[] = await this.coreClient.client
      .call("support", "userThemes")
      .catch((): UserThemeFile[] => []);
    const userThemes: UserTheme[] = [];
    for (const { file, data, error } of files) {
      const { theme, problems } = error
        ? { theme: null, problems: [error] }
        : parseTheme(data, file);
      for (const problem of problems) {
        const message = `Theme ${file}: ${problem}`;
        if (!this.reported.has(message)) {
          this.reported.add(message);
          this.loggerService.error(message);
        }
      }
      // (an app theme's name stays the app theme)
      if (theme && !this.appThemeNames.includes(theme.name)) {
        userThemes.push({ theme, file });
      }
    }
    this.userThemes.next(userThemes);
  }

  // Saves a user theme (to `file`, or a new file named after it); returns
  // the file.
  async saveUserTheme(theme: ThemeDefinition, file?: string) {
    const target = file ?? this.newFileName(theme.name);
    const saved: string = await this.coreClient.client.call(
      "support",
      "saveUserTheme",
      target,
      {
        name: theme.name,
        colorScheme: theme.colorScheme,
        layout: theme.layout,
        tokens: theme.tokens,
      },
    );
    await this.loadUserThemes();
    return saved;
  }

  async deleteUserTheme(file: string) {
    await this.coreClient.client.call("support", "deleteUserTheme", file);
    await this.loadUserThemes();
  }

  // "Sunset Glow" -> "sunset-glow.json" (-2, -3... if taken).
  private newFileName(name: string) {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "theme";
    const taken = new Set(this.userThemeList.map((u) => u.file.toLowerCase()));
    let file = `${base}.json`;
    for (let n = 2; taken.has(file); n++) file = `${base}-${n}.json`;
    return file;
  }

  // Applies a theme by name (unknown names: the default theme).
  apply(name: string) {
    const theme = this.find(name) ?? appThemes[0];
    this.applyDefinition(theme);
    return theme.name;
  }

  // Applies a theme that needn't be saved (the theme editor's preview).
  applyDefinition(theme: ThemeDefinition) {
    const root = document.documentElement;
    const values = { ...baseTokens, ...theme.tokens };
    for (const token of tokenNames) {
      root.style.setProperty(cssVar(token), values[token]);
    }
    root.style.colorScheme = theme.colorScheme;
    // The layout's rules (themes.global.scss) hang off this class.
    root.className = theme.layout;
  }
}
