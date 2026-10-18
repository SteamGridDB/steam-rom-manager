import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { APP } from "../../variables";
import { LoggerService } from "../services";
import { ThemeService } from "../theme/theme.service";
import { baseTokens, isValidTokenValue } from "../theme/themes";
import {
  ThemeDefinition,
  ThemeLayout,
  TokenGroup,
  TokenName,
  themeLayouts,
  tokenGroups,
  tokenNames,
  tokens,
} from "../theme/tokens";

// What the editor has open: an app theme (read-only), a saved user theme,
// or a new one not saved yet.
type Selection =
  | { kind: "app"; name: string }
  | { kind: "user"; file: string }
  | { kind: "new" };

// The theme editor (a tab of Settings): user themes are edited, previewed
// live on the whole app, saved to themes/user, and deleted; app themes can
// be looked at and duplicated.
@Component({
  selector: "theme-editor",
  templateUrl: "../templates/theme-editor.component.html",
  styleUrls: ["../styles/theme-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeEditorComponent implements OnInit, OnDestroy {
  // The theme Settings uses.
  @Input() activeTheme: string;
  // "Use this theme" (and the theme to fall back to when it's deleted).
  @Output() useTheme = new EventEmitter<string>();
  // Themes were saved or deleted (Settings' theme list).
  @Output() themesChanged = new EventEmitter<void>();

  readonly groups = tokenGroups;
  // EmuDeck's layout works differently (for EmuDeck installs): not one to
  // build themes on, so the editor leaves it (and its theme) out.
  readonly layouts: ThemeLayout[] = themeLayouts.filter((l) => l !== "EmuDeck");

  get appThemes() {
    return this.themeService.appThemes.filter((t) =>
      this.layouts.includes(t.layout),
    );
  }
  selection: Selection = { kind: "new" };
  draft: ThemeDefinition = this.blank();
  private savedDraft = "";
  preview = true;
  search = "";
  changedOnly = false;
  busy = false;

  constructor(
    public themeService: ThemeService,
    private loggerService: LoggerService,
    private changeRef: ChangeDetectorRef,
  ) {}

  get lang() {
    return APP.lang.settings.component.themeEditor;
  }

  async ngOnInit() {
    await this.themeService.loadUserThemes();
    const user = this.themeService.userThemeList.find(
      (u) => u.theme.name === this.activeTheme,
    );
    if (user) this.open({ kind: "user", file: user.file }, false);
    else {
      const app = this.appThemes.find((t) => t.name === this.activeTheme);
      this.open({ kind: "app", name: (app ?? this.appThemes[0]).name }, false);
    }
    this.changeRef.markForCheck();
  }

  ngOnDestroy() {
    // (back to the theme in use)
    this.themeService.apply(this.activeTheme);
  }

  // ---- what's open ----

  get editable() {
    return this.selection.kind !== "app";
  }

  get dirty() {
    return this.editable && this.snapshot(this.draft) !== this.savedDraft;
  }

  isSelected(selection: Selection) {
    const s = this.selection;
    return (
      s.kind === selection.kind &&
      (s.kind !== "app" || s.name === (selection as any).name) &&
      (s.kind !== "user" || s.file === (selection as any).file)
    );
  }

  // Opens a theme (after asking, if there are unsaved changes).
  open(selection: Selection, ask = true) {
    if (ask && !this.okToLeave()) return;
    const theme =
      selection.kind === "app"
        ? (this.themeService.find(selection.name) ??
          this.themeService.appThemes[0])
        : selection.kind === "user"
          ? this.themeService.userThemeList.find(
              (u) => u.file === selection.file,
            )?.theme
          : this.blank();
    if (!theme) return;
    this.selection =
      selection.kind === "app" ? { kind: "app", name: theme.name } : selection;
    this.draft = structuredClone(theme);
    this.savedDraft = selection.kind === "new" ? "" : this.snapshot(this.draft);
    this.refreshPreview();
  }

  newTheme() {
    if (!this.okToLeave()) return;
    this.selection = { kind: "new" };
    this.draft = this.blank();
    this.savedDraft = "";
    this.refreshPreview();
  }

  // A new theme from the open one.
  duplicate() {
    if (!this.okToLeave()) return;
    const copy = structuredClone(this.draft);
    copy.name = this.freeName(
      this.lang.copyName__i.interpolate({ name: this.draft.name }),
    );
    this.selection = { kind: "new" };
    this.draft = copy;
    this.savedDraft = "";
    this.refreshPreview();
  }

  private okToLeave() {
    return !this.dirty || window.confirm(this.lang.confirmDiscard);
  }

  private blank(): ThemeDefinition {
    return {
      name: this.freeName(this.lang?.untitled ?? "My theme"),
      colorScheme: "dark",
      layout: "Deck",
      tokens: {},
    };
  }

  // `name`, or `name 2`, `name 3`... if it's taken.
  private freeName(name: string) {
    const taken = new Set(this.themeService?.themeNames ?? []);
    let free = name;
    for (let n = 2; taken.has(free); n++) free = `${name} ${n}`;
    return free;
  }

  private snapshot(theme: ThemeDefinition) {
    return JSON.stringify({
      ...theme,
      tokens: Object.fromEntries(
        Object.entries(theme.tokens).sort(([a], [b]) => a.localeCompare(b)),
      ),
    });
  }

  // ---- editing ----

  setName(name: string) {
    this.draft.name = name;
  }

  setColorScheme(scheme: "dark" | "light") {
    this.draft.colorScheme = scheme;
    this.refreshPreview();
  }

  setLayout(layout: ThemeLayout) {
    this.draft.layout = layout;
    this.refreshPreview();
  }

  // As typed (trimmed when saved, so typing a space isn't undone); empty:
  // the base theme's value.
  setToken(token: TokenName, value: string) {
    if (value.trim()) this.draft.tokens[token] = value;
    else delete this.draft.tokens[token];
    this.refreshPreview();
  }

  value(token: TokenName) {
    return this.draft.tokens[token] ?? "";
  }

  base(token: TokenName) {
    return baseTokens[token];
  }

  // What the token comes out as (for the swatch).
  effective(token: TokenName) {
    const own = this.draft.tokens[token];
    return own && !this.isInvalid(token) ? own : baseTokens[token];
  }

  isColor(token: TokenName) {
    return tokens[token].kind === "color";
  }

  hasSwatch(token: TokenName) {
    return ["color", "paint"].includes(tokens[token].kind);
  }

  isInvalid(token: TokenName) {
    const own = this.draft.tokens[token];
    return own !== undefined && !isValidTokenValue(token, own);
  }

  get invalidCount() {
    return tokenNames.filter((t) => this.isInvalid(t)).length;
  }

  describe(token: TokenName) {
    return this.lang.tokens[token];
  }

  tokensIn(group: TokenGroup): TokenName[] {
    const search = this.search.trim().toLowerCase();
    return tokenNames.filter(
      (token) =>
        tokens[token].group === group &&
        (!this.changedOnly || this.draft.tokens[token] !== undefined) &&
        (!search ||
          token.includes(search) ||
          this.describe(token).toLowerCase().includes(search)),
    );
  }

  // ---- preview ----

  togglePreview() {
    this.preview = !this.preview;
    this.refreshPreview();
  }

  private refreshPreview() {
    if (!this.preview) {
      this.themeService.apply(this.activeTheme);
      return;
    }
    // (invalid values left out, as a saved theme would)
    const valid = Object.fromEntries(
      Object.entries(this.draft.tokens).filter(([token, value]) =>
        isValidTokenValue(token as TokenName, value),
      ),
    );
    this.themeService.applyDefinition({ ...this.draft, tokens: valid });
  }

  // ---- saving ----

  get nameProblem(): string | null {
    const name = this.draft.name.trim();
    if (!name) return this.lang.errors.noName;
    const own =
      this.selection.kind === "user"
        ? (this.selection as { file: string }).file
        : null;
    const taken =
      this.themeService.appThemeNames.includes(name) ||
      this.themeService.userThemeList.some(
        (u) => u.theme.name === name && u.file !== own,
      );
    return taken ? this.lang.errors.nameTaken__i.interpolate({ name }) : null;
  }

  get canSave() {
    return (
      this.editable && this.dirty && !this.nameProblem && !this.invalidCount
    );
  }

  async save() {
    if (!this.canSave || this.busy) return;
    this.busy = true;
    const previousName =
      this.selection.kind === "user"
        ? this.themeService.userThemeList.find(
            (u) => u.file === (this.selection as { file: string }).file,
          )?.theme.name
        : undefined;
    try {
      this.draft.name = this.draft.name.trim();
      for (const token of Object.keys(this.draft.tokens) as TokenName[]) {
        this.draft.tokens[token] = this.draft.tokens[token].trim();
      }
      const file = await this.themeService.saveUserTheme(
        this.draft,
        this.selection.kind === "user" ? this.selection.file : undefined,
      );
      this.selection = { kind: "user", file };
      this.savedDraft = this.snapshot(this.draft);
      this.loggerService.success(
        this.lang.saved__i.interpolate({ name: this.draft.name }),
        { invokeAlert: true, alertTimeout: 3000 },
      );
      this.themesChanged.emit();
      // (renamed the theme in use: keep using it)
      if (previousName && previousName === this.activeTheme) {
        this.useTheme.emit(this.draft.name);
      }
    } catch (error) {
      this.loggerService.error(
        this.lang.errors.saving__i.interpolate({ error: String(error) }),
        { invokeAlert: true, alertTimeout: 5000 },
      );
    } finally {
      this.busy = false;
      this.changeRef.markForCheck();
    }
  }

  revert() {
    if (this.selection.kind === "new") this.newTheme();
    else this.open(this.selection, false);
  }

  async delete() {
    if (this.selection.kind !== "user" || this.busy) return;
    const { file } = this.selection;
    const name =
      this.themeService.userThemeList.find((u) => u.file === file)?.theme
        .name ?? this.draft.name;
    if (!window.confirm(this.lang.confirmDelete__i.interpolate({ name }))) {
      return;
    }
    this.busy = true;
    try {
      await this.themeService.deleteUserTheme(file);
      this.loggerService.info(this.lang.deleted__i.interpolate({ name }), {
        invokeAlert: true,
        alertTimeout: 3000,
      });
      this.themesChanged.emit();
      const fallback = this.themeService.appThemes[0].name;
      if (name === this.activeTheme) this.useTheme.emit(fallback);
      this.open(
        {
          kind: "app",
          name: name === this.activeTheme ? fallback : this.activeTheme,
        },
        false,
      );
    } catch (error) {
      this.loggerService.error(
        this.lang.errors.deleting__i.interpolate({ error: String(error) }),
        { invokeAlert: true, alertTimeout: 5000 },
      );
    } finally {
      this.busy = false;
      this.changeRef.markForCheck();
    }
  }

  get inUse() {
    return !this.dirty && this.draft.name === this.activeTheme;
  }

  get canUse() {
    return this.selection.kind !== "new" && !this.dirty && !this.inUse;
  }

  use() {
    if (this.canUse) this.useTheme.emit(this.draft.name);
  }
}
