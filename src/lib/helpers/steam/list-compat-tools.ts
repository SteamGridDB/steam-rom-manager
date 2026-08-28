import { glob } from "glob";
import * as genericParser from "@node-steam/vdf";
import * as path from "path";
import * as fs from "fs-extra";

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

// Steam does not declare its official Proton builds in compatibilitytools.d,
// so we can't discover them by scanning. Offer the well-known internal names as
// static suggestions; the free-text field covers anything not listed here.
const OFFICIAL_PROTON_TOOLS: CompatToolInfo[] = [
  { name: "proton_experimental", displayName: "Proton Experimental" },
  { name: "proton_9", displayName: "Proton 9.0" },
  { name: "proton_8", displayName: "Proton 8.0" },
  { name: "proton_7", displayName: "Proton 7.0" },
  { name: "proton_63", displayName: "Proton 6.3" },
  { name: "proton_513", displayName: "Proton 5.13" },
];

// Extra roots that hold system/distro-provided compat tools (e.g. CachyOS ships
// proton-cachyos here) which live outside any Steam directory.
const SYSTEM_COMPAT_ROOTS = [
  "/usr/share/steam/compatibilitytools.d",
  "/usr/local/share/steam/compatibilitytools.d",
];

function readToolsFromVdf(vdfPath: string): CompatToolInfo[] {
  const tools: CompatToolInfo[] = [];
  try {
    const parsed = genericParser.parse(fs.readFileSync(vdfPath, "utf-8")) as any;
    // Casing has been seen as both "compatibilitytools"/"compat_tools"; be lenient.
    const top =
      parsed?.compatibilitytools ?? parsed?.CompatibilityTools ?? parsed;
    const compatTools = top?.compat_tools ?? top?.compatTools;
    if (compatTools && typeof compatTools === "object") {
      for (const internalName of Object.keys(compatTools)) {
        const displayName =
          compatTools[internalName]?.display_name?.toString() || internalName;
        tools.push({ name: internalName.toString(), displayName });
      }
    }
  } catch (error) {
    // A malformed or unreadable tool manifest just contributes nothing.
  }
  return tools;
}

// Enumerate compatibility tools installed on this machine by scanning every
// compatibilitytools.d root (per-Steam-install plus system roots), reading the
// internal name(s) and display name(s) declared in each compatibilitytool.vdf,
// then appending the static official Proton suggestions. De-duped by internal name.
export async function listAvailableCompatTools(
  steamDirectories: string[],
): Promise<CompatToolInfo[]> {
  const roots = [
    ...steamDirectories.map((dir) =>
      path.join(dir, "compatibilitytools.d"),
    ),
    ...SYSTEM_COMPAT_ROOTS,
  ];

  const found: CompatToolInfo[] = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) {
      continue;
    }
    const manifests = await glob("*/compatibilitytool.vdf", { cwd: root });
    for (const manifest of manifests) {
      found.push(...readToolsFromVdf(path.join(root, manifest)));
    }
  }

  found.push(...OFFICIAL_PROTON_TOOLS);

  const seen = new Set<string>();
  return found.filter((tool) => {
    if (!tool.name || seen.has(tool.name)) {
      return false;
    }
    seen.add(tool.name);
    return true;
  });
}
