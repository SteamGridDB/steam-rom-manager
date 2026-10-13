import { ThemeDefinition, ThemeTokens } from "./tokens";

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

  border: "rgba(255, 255, 255, 0.06)",
  "border-strong": "rgba(255, 255, 255, 0.12)",
  "focus-ring": "rgba(49, 160, 244, 0.65)",

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

// Built-in themes: variants of the same design.
export const builtInThemes: ThemeDefinition[] = [
  {
    // The default: deep blue-black, Steam-blue accent.
    name: "Deck",
    colorScheme: "dark",
    tokens: {},
  },
  {
    // SRM's original look: near-black, green accent, flatter.
    name: "Classic",
    colorScheme: "dark",
    tokens: {
      bg: "#080808",
      "bg-art": "none",
      surface: "#101010",
      "surface-raised": "#171717",
      "surface-hover": "#202020",
      "surface-sunken": "#0a0a0a",
      glass: "rgba(16, 16, 16, 0.85)",
      "art-overlay": "rgba(0, 0, 0, 0.8)",
      "text-muted": "#a0a0a0",
      accent: "#1db954",
      "accent-hover": "#1ed760",
      "accent-soft": "rgba(29, 185, 84, 0.16)",
      "accent-gradient": "linear-gradient(135deg, #1db954 0%, #17a34a 100%)",
      "focus-ring": "rgba(29, 185, 84, 0.6)",
      link: "#1ed760",
      glow: "0 0 0 2px rgba(29, 185, 84, 0.85), 0 8px 30px rgba(29, 185, 84, 0.3)",
      "radius-md": "6px",
      "radius-lg": "8px",
      "radius-art": "4px",
    },
  },
  {
    // For EmuDeck installs: sits on EmuDeck's own backdrop, so the app
    // background stays transparent.
    name: "EmuDeck",
    colorScheme: "dark",
    tokens: {
      bg: "transparent",
      "bg-art": "none",
      surface: "rgba(18, 21, 28, 0.82)",
    },
  },
];
