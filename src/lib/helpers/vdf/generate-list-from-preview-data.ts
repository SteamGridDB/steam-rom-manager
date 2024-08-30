import { PreviewData, VDF_ListData } from "../../../models";
import { VDF_AddedItemsFile } from "../../vdf-added-items-file";
import { VDF_ScreenshotsFile } from "../../vdf-screenshots-file";
import { VDF_ShortcutsFile } from "../../vdf-shortcuts-file";
import * as path from "path";
import * as paths from "../../../paths";

export function generateListFromPreviewData(previewData: PreviewData) {
  return Promise.resolve().then(() => {
    let vdfData: VDF_ListData = {};
    let numberOfGeneratedEntries: number = 0;
    for (let directory in previewData) {
      for (let user in previewData[directory]) {
        if (vdfData[directory] === undefined) vdfData[directory] = {};

        if (vdfData[directory][user] === undefined) {
          numberOfGeneratedEntries++;
          vdfData[directory][user] = {
            addedItems: new VDF_AddedItemsFile(
              path.join(
                directory,
                "userdata",
                user,
                "config",
                paths.savedListFilename,
              ),
            ),
            screenshots: new VDF_ScreenshotsFile(
              path.join(directory, "userdata", user, "760", "screenshots.vdf"),
              path.join(directory, "userdata", user, "config", "grid"),
            ),
            shortcuts: new VDF_ShortcutsFile(
              path.join(directory, "userdata", user, "config", "shortcuts.vdf"),
            ),
          };
        }
      }
    }
    return { data: vdfData, numberOfGeneratedEntries, errors: [] as string[] };
  });
}
