// Linear gradients for the theme editor's gradient builder (paint tokens):
// read one into angle + colors, and write one back. Stripes are bands with
// hard edges, like a flag; otherwise the colors blend evenly.

export interface Gradient {
  angle: number; // degrees
  colors: string[];
  stripes: boolean;
}

// Flags to start from (stripes, top to bottom).
export const flagPresets: Record<string, string[]> = {
  rainbow: ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"],
  trans: ["#5bcefa", "#f5a9b8", "#ffffff", "#f5a9b8", "#5bcefa"],
  bisexual: ["#d60270", "#d60270", "#9b4f96", "#0038a8", "#0038a8"],
  lesbian: ["#d52d00", "#ef7627", "#ff9a56", "#ffffff", "#d162a4", "#b55690", "#a30262"],
  nonbinary: ["#fcf434", "#ffffff", "#9c59d1", "#2c2c2c"],
  pansexual: ["#ff218c", "#ffd800", "#21b1ff"],
  asexual: ["#000000", "#a3a3a3", "#ffffff", "#800080"],
};

const round = (n: number) => Math.round(n * 100) / 100;

export function formatGradient({ angle, colors, stripes }: Gradient) {
  if (!colors.length) return "";
  const list = colors.length === 1 ? [colors[0], colors[0]] : colors;
  const stops = stripes
    ? list.map((color, i) => {
        const from = round((i * 100) / list.length);
        const to = round(((i + 1) * 100) / list.length);
        return `${color} ${from}% ${to}%`;
      })
    : list.map(
        (color, i) => `${color} ${round((i * 100) / (list.length - 1))}%`,
      );
  return `linear-gradient(${round(angle)}deg, ${stops.join(", ")})`;
}

// Splits at the commas that aren't inside parentheses.
function splitTopLevel(text: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(text.slice(start).trim());
  return parts;
}

// (one gradient: "a), linear-gradient(b" is two layers' insides)
function balanced(text: string) {
  let depth = 0;
  for (const c of text) {
    if (c === "(") depth++;
    else if (c === ")" && --depth < 0) return false;
  }
  return depth === 0;
}

const sideAngles: Record<string, number> = {
  "to top": 0,
  "to right": 90,
  "to bottom": 180,
  "to left": 270,
};

// A gradient the builder can edit, or null (e.g. radial, or several
// layers): those are left to the text field.
export function parseGradient(value: string): Gradient | null {
  const match = /^\s*linear-gradient\((.*)\)\s*$/is.exec(value ?? "");
  if (!match || !balanced(match[1])) return null;
  const parts = splitTopLevel(match[1]);
  let angle = 180;
  const first = parts[0].toLowerCase();
  if (/^-?[\d.]+deg$/.test(first)) {
    angle = parseFloat(first);
    parts.shift();
  } else if (first in sideAngles) {
    angle = sideAngles[first];
    parts.shift();
  } else if (first.startsWith("to ")) {
    return null;
  }
  // A stop: a color, then up to two positions.
  const stops = parts.map((part) => {
    const m = /^(.*?)((?:\s+-?[\d.]+%){0,2})$/.exec(part);
    return {
      color: m[1].trim(),
      positions: (m[2].match(/-?[\d.]+(?=%)/g) ?? []).map(Number),
    };
  });
  if (stops.length < 2 || stops.some((s) => !s.color)) return null;
  const stripes = stops.every((s) => s.positions.length === 2);
  return { angle, colors: stops.map((s) => s.color), stripes };
}
