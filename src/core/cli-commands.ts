import { UserConfiguration } from "../models";
import { Core } from "./core";

// What the CLI commands print to; the main process maps this to stdout.
export interface CliOutput {
  log(line: string): void;
  // Replaces the current line (progress).
  inline(line: string): void;
}

export function list(core: Core): UserConfiguration[] {
  return core.parsers.getAll();
}

export async function setEnabled(
  core: Core,
  out: CliOutput,
  enabled: boolean,
  options: { all: boolean; names: boolean; parsers: string[] },
) {
  if (options.all) {
    await core.parsers.setAllEnabled(enabled);
    return;
  }
  const { ids, missing } = core.parsers.resolveParserIds(
    options.parsers,
    options.names,
  );
  for (const name of missing) {
    out.log(`Could not find parser ${name}`);
  }
  for (const id of ids) {
    try {
      await core.parsers.setEnabled(id, enabled);
      out.log(enabled ? `Enabled parser ${id}` : `Disabled parser ${id}`);
    } catch (e) {
      out.log(String(e));
    }
  }
}

// Generates the app list and waits for its artwork, reporting progress.
// Returns the number of apps.
async function generate(core: Core, out: CliOutput): Promise<number> {
  out.log("Generating app list");
  await core.preview.generatePreviewData();
  const vars = core.preview.getPreviewVariables();
  if (vars.numberOfListItems === 0) {
    out.log("No apps found");
    return 0;
  }
  const progress = () =>
    out.inline(
      `Apps: ${vars.numberOfListItems}. Remaining images: ${vars.numberOfQueriedImages}`,
    );
  const subscription = core.preview.getPreviewDataChange().subscribe(progress);
  progress();
  await core.preview.waitForImages();
  subscription.unsubscribe();
  progress();
  out.log("");
  return vars.numberOfListItems;
}

export async function add(core: Core, out: CliOutput): Promise<boolean> {
  if ((await generate(core, out)) === 0) {
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

export async function remove(core: Core, out: CliOutput): Promise<boolean> {
  if ((await generate(core, out)) === 0) {
    return true;
  }
  out.log("Removing app list from steam");
  return core.preview.removeAllInPreview();
}

export async function nuke(core: Core, out: CliOutput): Promise<boolean> {
  out.log("Nuking steam library");
  return core.preview.removeAllAdded();
}
