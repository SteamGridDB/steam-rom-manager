// SRM's design tokens: every themeable value, by name. This list is the
// source of truth (like en-US for languages):
// - a theme (built in, or a user's JSON file) sets some of these; anything it
//   leaves out comes from the base theme (themes/base.ts);
// - stylesheets use them as CSS variables (`var(--srm-accent)`) and contain
//   no colors of their own (checked by test/unit/theme.test.ts).
//
// Kinds tell the user-theme loader what a value may look like.

export type TokenKind =
  | "color" // any CSS color, incl. rgba()/transparent
  | "paint" // a color or a gradient (background-image)
  | "shadow" // a box-shadow value
  | "length" // e.g. 0.5em, 12px
  | "number" // unitless, e.g. 1.15
  | "font" // a font-family list
  | "time" // e.g. 180ms
  | "easing" // e.g. cubic-bezier(...)
  | "filter"; // e.g. invert(1)

// Sections of the theme editor, in order.
export const tokenGroups = [
  "surfaces",
  "text",
  "lines",
  "accent",
  "scrollbars",
  "depth",
  "type",
  "shape",
  "motion",
] as const;
export type TokenGroup = (typeof tokenGroups)[number];

// What each token is for (shown in the theme editor) is in the language
// files: settings.component.themeEditor.tokens.
export const tokens = {
  bg: { kind: "color", group: "surfaces" },
  "bg-art": { kind: "paint", group: "surfaces" },
  surface: { kind: "color", group: "surfaces" },
  "surface-raised": { kind: "color", group: "surfaces" },
  "surface-hover": { kind: "color", group: "surfaces" },
  "surface-sunken": { kind: "color", group: "surfaces" },
  glass: { kind: "color", group: "surfaces" },
  "glass-border": { kind: "color", group: "surfaces" },
  scrim: { kind: "color", group: "surfaces" },
  "art-overlay": { kind: "color", group: "surfaces" },

  text: { kind: "color", group: "text" },
  "text-muted": { kind: "color", group: "text" },
  "text-subtle": { kind: "color", group: "text" },
  "text-on-accent": { kind: "color", group: "text" },
  link: { kind: "color", group: "text" },
  "icon-filter": { kind: "filter", group: "text" },

  border: { kind: "color", group: "lines" },
  "border-strong": { kind: "color", group: "lines" },
  "focus-ring": { kind: "color", group: "lines" },
  "nav-edge": { kind: "paint", group: "lines" },
  "nav-edge-width": { kind: "length", group: "lines" },

  accent: { kind: "color", group: "accent" },
  "accent-hover": { kind: "color", group: "accent" },
  "accent-soft": { kind: "color", group: "accent" },
  "accent-gradient": { kind: "paint", group: "accent" },
  success: { kind: "color", group: "accent" },
  "success-soft": { kind: "color", group: "accent" },
  warning: { kind: "color", group: "accent" },
  "warning-soft": { kind: "color", group: "accent" },
  danger: { kind: "color", group: "accent" },
  "danger-soft": { kind: "color", group: "accent" },
  info: { kind: "color", group: "accent" },

  scrollbar: { kind: "color", group: "scrollbars" },
  "scrollbar-hover": { kind: "color", group: "scrollbars" },

  "shadow-sm": { kind: "shadow", group: "depth" },
  "shadow-md": { kind: "shadow", group: "depth" },
  "shadow-lg": { kind: "shadow", group: "depth" },
  glow: { kind: "shadow", group: "depth" },
  blur: { kind: "length", group: "depth" },

  font: { kind: "font", group: "type" },
  "font-display": { kind: "font", group: "type" },
  "font-mono": { kind: "font", group: "type" },
  "font-size": { kind: "length", group: "type" },
  "line-height": { kind: "number", group: "type" },

  "radius-sm": { kind: "length", group: "shape" },
  "radius-md": { kind: "length", group: "shape" },
  "radius-lg": { kind: "length", group: "shape" },
  "radius-art": { kind: "length", group: "shape" },
  space: { kind: "length", group: "shape" },
  "nav-width": { kind: "length", group: "shape" },

  "duration-fast": { kind: "time", group: "motion" },
  duration: { kind: "time", group: "motion" },
  "duration-slow": { kind: "time", group: "motion" },
  ease: { kind: "easing", group: "motion" },
  "ease-spring": { kind: "easing", group: "motion" },
} as const satisfies Record<string, { kind: TokenKind; group: TokenGroup }>;

export type TokenName = keyof typeof tokens;
export const tokenNames = Object.keys(tokens) as TokenName[];

// A theme's values: any subset of the tokens (TypeScript rejects unknown
// names, so a typo can't silently do nothing).
export type ThemeTokens = Partial<Record<TokenName, string>>;

// Layouts: arrangements of the screens, independent of colors. The CSS class
// on <html> (themes.global.scss hangs each layout's rules off it).
export const themeLayouts = ["Deck", "Classic", "EmuDeck"] as const;
export type ThemeLayout = (typeof themeLayouts)[number];

export interface ThemeDefinition {
  // Shown in Settings.
  name: string;
  // Light or dark: picks the browser's built-in control colors.
  colorScheme: "dark" | "light";
  // Optional in theme files (default: Deck).
  layout: ThemeLayout;
  tokens: ThemeTokens;
}

// The CSS variable for a token.
export const cssVar = (name: TokenName) => `--srm-${name}`;
