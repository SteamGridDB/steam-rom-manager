import { UserConfiguration } from "../models";
import { Core } from "./core";
import { findParsers } from "./parser-commands";

// What the CLI commands print to; the main process maps this to stdout.
export interface CliOutput {
  log(line: string): void;
  // Replaces the current line (progress).
  inline(line: string): void;
}

export function list(core: Core): UserConfiguration[] {
  return core.parsers.getAll();
}

// Enables/disables parsers (ids or names), or all of them. Returns whether
// it did: an unknown parser changes nothing.
export async function setEnabled(
  core: Core,
  out: CliOutput,
  enabled: boolean,
  options: { all: boolean; parsers: string[] },
): Promise<boolean> {
  if (options.all) {
    await core.parsers.setAllEnabled(enabled);
    return true;
  }
  const found = findParsers(core, options.parsers);
  if (!found.ok) {
    for (const error of found.errors) out.log(error);
    return false;
  }
  for (const config of found.value) {
    await core.parsers.setEnabled(config.parserId, enabled);
    out.log(
      `${enabled ? "Enabled" : "Disabled"} parser "${config.configTitle}" (id ${config.parserId})`,
    );
  }
  return true;
}

// add/remove: run just these parsers (ids or names), enabled or not.
export interface RunOptions {
  only?: string[];
}

// The parser ids for --only; undefined (after reporting) if any is unknown.
function onlyParserIds(
  core: Core,
  out: CliOutput,
  { only }: RunOptions,
): string[] | undefined | null {
  if (!only) {
    return null; // every enabled parser
  }
  const found = findParsers(core, only);
  if (!found.ok) {
    for (const error of found.errors) out.log(error);
    return undefined;
  }
  out.log(`Running only: ${found.value.map((c) => c.configTitle).join(", ")}`);
  return found.value.map((c) => c.parserId);
}

// Generates the app list and waits for its artwork, reporting progress.
// Returns the number of apps.
async function generate(
  core: Core,
  out: CliOutput,
  parserIds: string[] | null,
): Promise<number> {
  out.log("Generating app list");
  await core.preview.generatePreviewData(parserIds ? { parserIds } : undefined);
  const vars = core.preview.getPreviewVariables();
  if (vars.numberOfListItems === 0) {
    out.log("No apps found");
    return 0;
  }
  let last = "";
  const progress = () => {
    const line = `Apps: ${vars.numberOfListItems}. Remaining images: ${vars.numberOfQueriedImages}`;
    if (line !== last) {
      last = line;
      out.inline(line);
    }
  };
  const subscription = core.preview.getPreviewDataChange().subscribe(progress);
  progress();
  await core.preview.waitForImages();
  subscription.unsubscribe();
  progress();
  out.log("");
  return vars.numberOfListItems;
}

export async function add(
  core: Core,
  out: CliOutput,
  options: RunOptions = {},
): Promise<boolean> {
  const parserIds = onlyParserIds(core, out, options);
  if (parserIds === undefined) {
    return false;
  }
  if ((await generate(core, out, parserIds)) === 0) {
    return true;
  }
  out.log("Adding app list to steam");
  const subscription = core.preview
    .getBatchProgress()
    .subscribe(({ update, batch }) => batch > -1 && out.inline(update));
  try {
    return await core.preview.saveData({ removeAll: false, batchWrite: true });
  } finally {
    subscription.unsubscribe();
  }
}

export async function remove(
  core: Core,
  out: CliOutput,
  options: RunOptions = {},
): Promise<boolean> {
  const parserIds = onlyParserIds(core, out, options);
  if (parserIds === undefined) {
    return false;
  }
  if ((await generate(core, out, parserIds)) === 0) {
    return true;
  }
  out.log("Removing app list from steam");
  return core.preview.removeAllInPreview();
}

export async function nuke(core: Core, out: CliOutput): Promise<boolean> {
  out.log("Nuking steam library");
  return core.preview.removeAllAdded();
}
