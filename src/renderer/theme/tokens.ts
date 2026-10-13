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
  | "easing"; // e.g. cubic-bezier(...)

export const tokens = {
  // Surfaces, from the deepest back to the most raised.
  bg: { kind: "color", about: "App background behind everything" },
  "bg-art": {
    kind: "paint",
    about: "Ambient backdrop over the background (e.g. a soft gradient)",
  },
  surface: { kind: "color", about: "Panels: navigation, side panels, menus" },
  "surface-raised": { kind: "color", about: "Cards, inputs, list rows" },
  "surface-hover": {
    kind: "color",
    about: "A raised surface under the pointer",
  },
  "surface-sunken": {
    kind: "color",
    about: "Wells: code blocks, empty areas, tracks",
  },
  glass: {
    kind: "color",
    about: "Translucent panels over artwork (used with blur)",
  },
  "glass-border": { kind: "color", about: "Edge of glass panels" },
  scrim: { kind: "color", about: "Dimming behind dialogs and overlays" },
  "art-overlay": {
    kind: "color",
    about: "Over artwork while its controls show (keep it translucent)",
  },

  // Text.
  text: { kind: "color", about: "Primary text" },
  "text-muted": { kind: "color", about: "Secondary text, labels" },
  "text-subtle": { kind: "color", about: "Hints, placeholders, disabled text" },
  "text-on-accent": {
    kind: "color",
    about: "Text on accent-colored backgrounds",
  },
  link: { kind: "color", about: "Links in docs and messages" },

  // Lines.
  border: { kind: "color", about: "Hairlines between areas" },
  "border-strong": { kind: "color", about: "Input and card outlines" },
  "focus-ring": { kind: "color", about: "Keyboard focus outline" },

  // Accent and states.
  accent: {
    kind: "color",
    about: "Brand color: primary buttons, active items, toggles",
  },
  "accent-hover": { kind: "color", about: "Accent under the pointer" },
  "accent-soft": {
    kind: "color",
    about: "Translucent accent: selected rows, badges",
  },
  "accent-gradient": { kind: "paint", about: "Primary call-to-action fill" },
  success: { kind: "color", about: "Done, valid, enabled" },
  "success-soft": { kind: "color", about: "Translucent success" },
  warning: { kind: "color", about: "Unsaved, needs attention" },
  "warning-soft": { kind: "color", about: "Translucent warning" },
  danger: {
    kind: "color",
    about: "Destructive actions, errors, invalid input",
  },
  "danger-soft": { kind: "color", about: "Translucent danger" },
  info: { kind: "color", about: "Informational highlights" },

  // Scrollbars.
  scrollbar: { kind: "color", about: "Scrollbar thumb" },
  "scrollbar-hover": {
    kind: "color",
    about: "Scrollbar thumb under the pointer",
  },

  // Depth.
  "shadow-sm": { kind: "shadow", about: "Small lift (buttons, chips)" },
  "shadow-md": { kind: "shadow", about: "Cards, menus" },
  "shadow-lg": { kind: "shadow", about: "Dialogs, hovered artwork" },
  glow: { kind: "shadow", about: "Accent glow (focused/selected artwork)" },
  blur: { kind: "length", about: "Backdrop blur of glass panels" },

  // Type.
  font: { kind: "font", about: "Interface text" },
  "font-display": { kind: "font", about: "Headings and titles" },
  "font-mono": { kind: "font", about: "Code, paths, ids" },
  "font-size": { kind: "length", about: "Base text size" },
  "line-height": { kind: "number", about: "Base line height" },

  // Shape and space.
  "radius-sm": { kind: "length", about: "Chips, small controls" },
  "radius-md": { kind: "length", about: "Buttons, inputs" },
  "radius-lg": { kind: "length", about: "Cards, panels" },
  "radius-art": { kind: "length", about: "Artwork corners" },
  space: {
    kind: "length",
    about: "Base spacing unit (paddings and gaps are multiples)",
  },
  "nav-width": {
    kind: "length",
    about: "Default width of the navigation sidebar",
  },

  // Motion.
  "duration-fast": { kind: "time", about: "Hovers, presses" },
  duration: { kind: "time", about: "Panels opening, crossfades" },
  "duration-slow": { kind: "time", about: "Page transitions" },
  ease: { kind: "easing", about: "Default easing" },
  "ease-spring": { kind: "easing", about: "Playful overshoot (hover lifts)" },
} as const satisfies Record<string, { kind: TokenKind; about: string }>;

export type TokenName = keyof typeof tokens;
export const tokenNames = Object.keys(tokens) as TokenName[];

// A theme's values: any subset of the tokens (TypeScript rejects unknown
// names, so a typo can't silently do nothing).
export type ThemeTokens = Partial<Record<TokenName, string>>;

export interface ThemeDefinition {
  // Shown in Settings; also the CSS class on <html> (layout rules, e.g. the
  // EmuDeck theme's simplified screens, hang off it).
  name: string;
  // Light or dark: picks the browser's built-in control colors.
  colorScheme: "dark" | "light";
  tokens: ThemeTokens;
}

// The CSS variable for a token.
export const cssVar = (name: TokenName) => `--srm-${name}`;
