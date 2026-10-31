import {
  ThemeDefinition,
  ThemeLayout,
  ThemeTokens,
  TokenKind,
  TokenName,
  themeLayouts,
  tokens,
} from "./tokens";
import { defaultThemeFiles } from "../../themes";

// The base theme: every token. Other themes (built-in and user themes) only
// set what they change; the rest comes from here.
export const baseTokens: Required<ThemeTokens> = {
  bg: "#0b0d12",
  "bg-art":
    "radial-gradient(1200px 600px at 85% -10%, rgba(49, 160, 244, 0.10), transparent 60%), radial-gradient(900px 500px at -10% 110%, rgba(140, 90, 255, 0.08), transparent 60%)",
  surface: "#12151c",
  "surface-raised": "#1a1e27",
  "surface-hover": "#232835",
  "surface-sunken": "#0e1016",
  glass: "rgba(22, 26, 35, 0.72)",
  "glass-border": "rgba(255, 255, 255, 0.07)",
  scrim: "rgba(5, 6, 10, 0.66)",
  "art-overlay": "rgba(0, 0, 0, 0.2)",

  text: "#eef1f6",
  "text-muted": "#a3abba",
  "text-subtle": "#6c7586",
  "text-on-accent": "#ffffff",
  link: "#6cbcff",
  "icon-filter": "none",

  border: "rgba(255, 255, 255, 0.06)",
  "border-strong": "rgba(255, 255, 255, 0.12)",
  "focus-ring": "rgba(49, 160, 244, 0.65)",
  // (none: the bar keeps its surface color; a gradient paints over it)
  "nav-edge": "none",
  "nav-edge-width": "2px",

  accent: "#31a0f4",
  "accent-hover": "#56b3f7",
  "accent-soft": "rgba(49, 160, 244, 0.16)",
  "accent-gradient": "linear-gradient(135deg, #31a0f4 0%, #5b7cfa 100%)",
  success: "#4cd38a",
  "success-soft": "rgba(76, 211, 138, 0.15)",
  warning: "#f5c451",
  "warning-soft": "rgba(245, 196, 81, 0.15)",
  danger: "#ef4f63",
  "danger-soft": "rgba(239, 79, 99, 0.15)",
  info: "#8f8cff",

  scrollbar: "rgba(255, 255, 255, 0.10)",
  "scrollbar-hover": "rgba(255, 255, 255, 0.22)",

  "shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.35)",
  "shadow-md": "0 6px 18px rgba(0, 0, 0, 0.38)",
  "shadow-lg": "0 18px 48px rgba(0, 0, 0, 0.55)",
  glow: "0 0 0 2px rgba(49, 160, 244, 0.85), 0 8px 30px rgba(49, 160, 244, 0.35)",
  blur: "18px",

  font: '"Roboto", "Segoe UI", system-ui, sans-serif',
  "font-display": '"Raleway", "Roboto", "Segoe UI", system-ui, sans-serif',
  "font-mono": '"Hack", ui-monospace, "Cascadia Mono", Consolas, monospace',
  "font-size": "14px",
  "line-height": "1.45",

  "radius-sm": "6px",
  "radius-md": "9px",
  "radius-lg": "14px",
  "radius-art": "10px",
  space: "8px",
  "nav-width": "18rem",

  "duration-fast": "120ms",
  duration: "220ms",
  "duration-slow": "380ms",
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

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
  filter: "filter",
};

// Themes may not load anything: no urls, imports or rule breakers.
const unsafe = /url\(|@import|expression\(|[;{}<>\\]/i;

export function isValidTokenValue(token: TokenName, value: string) {
  if (unsafe.test(value)) return false;
  const property = propertyFor[tokens[token].kind];
  return (
    value === "none" ||
    typeof CSS === "undefined" || // (tests)
    CSS.supports(property, value)
  );
}

// A theme from its JSON (app and user themes alike): unknown tokens and
// invalid values are left out (reported in `problems`); the base theme
// fills in the rest.
export function parseTheme(
  data: unknown,
  file: string,
): { theme: ThemeDefinition | null; problems: string[] } {
  const problems: string[] = [];
  const raw = data as {
    name?: unknown;
    colorScheme?: unknown;
    layout?: unknown;
    tokens?: unknown;
  };
  if (!raw || typeof raw !== "object") {
    return { theme: null, problems: ["not a JSON object"] };
  }
  let layout: ThemeLayout = "Deck";
  if (themeLayouts.includes(raw.layout as ThemeLayout)) {
    layout = raw.layout as ThemeLayout;
  } else if (raw.layout !== undefined) {
    problems.push(
      `unknown layout ${JSON.stringify(raw.layout)} (one of ${themeLayouts.join(", ")})`,
    );
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
    } else if (typeof value !== "string" || !isValidTokenValue(token, value)) {
      problems.push(`invalid value for "${key}": ${JSON.stringify(value)}`);
    } else {
      values[token] = value;
    }
  }
  return {
    theme: {
      name,
      colorScheme: raw.colorScheme === "light" ? "light" : "dark",
      layout,
      tokens: values,
    },
    problems,
  };
}

// The app's themes (src/themes/default), always available; the first is
// the default.
export const appThemes: ThemeDefinition[] = Object.entries(
  defaultThemeFiles,
).map(([file, data]) => parseTheme(data, file).theme);
