import { ValidatorModifier } from "../../models";
import { ParserFolders } from "../../models/parser-folders.model";

import { versionUp } from "./modifier-helpers";

export const parserFolders: ValidatorModifier<ParserFolders> = {
  controlProperty: "version",
  latestVersion: 0,
  fields: {
    /*
    0: {
        version: { method: versionUp},
        folderMap: { method: (oldFolders) => {
            //do stuff
        }}
    }
    */
  },
};
