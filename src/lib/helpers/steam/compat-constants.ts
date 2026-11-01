// Reserved sentinel values shared across the compat-tool feature.
// COMPAT_CUSTOM: parser-level select value meaning "use the free-text name
// typed into compatToolNameCustom".
// COMPAT_NONE: resolved value meaning "force no compat tool" (used by the
// per-game "None" override to opt a single game out of the parser default).
export const COMPAT_CUSTOM = "__custom__";
export const COMPAT_NONE = "__none__";

export interface CompatToolInfo {
  name: string; // internal name written to config.vdf (e.g. "proton-cachyos-slr")
  displayName: string; // human-facing label (e.g. "Proton-CachyOS (SLR)")
}
