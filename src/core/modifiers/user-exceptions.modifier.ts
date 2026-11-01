import { ValidatorModifier, UserExceptions } from "../../models";
import * as _ from "lodash";

import { versionUp } from "./modifier-helpers";
import { fromLegacy } from "../exceptions-format";

export const userExceptions: ValidatorModifier<UserExceptions> = {
  controlProperty: "exceptionsVersion",
  latestVersion: 3,
  fields: {
    undefined: {
      exceptionsVersion: { method: () => 0 },
      titles: {
        method: (oldValue: any, oldExceptions: any) => {
          if (!!oldExceptions.titles) {
            return oldExceptions.titles;
          } else {
            let result = _.cloneDeep(oldExceptions);
            delete result.exceptionsVersion;
            for (let key of Object.keys(result)) {
              result[key].searchTitle = "";
            }
            return result;
          }
        },
      },
    },
    0: {
      exceptionsVersion: { method: versionUp },
      titles: {
        method: (oldValue: any, oldExceptions: any) => {
          let result = _.cloneDeep(oldValue);
          for (let key in oldValue) {
            result[key].excludeArtwork = false;
          }
          return result;
        },
      },
    },
    1: {
      exceptionsVersion: { method: versionUp },
      titles: {
        method: (oldValue: any, oldExceptions: any) => {
          let result = _.cloneDeep(oldValue);
          for (let key in oldValue) {
            result[key].timeStamp = Date.now();
          }
          return result;
        },
      },
    },
    // Keys like "<title> ${id:<appId>}" become separate exclusion and
    // exception lists with explicit matchAppId / matchTitle. (An older SRM
    // that saved over a version 3 file reset it to 2 and kept only titles,
    // so this also picks up its changes.)
    2: {
      exceptionsVersion: { method: versionUp },
      exceptions: {
        method: (_old: any, data: any) => fromLegacy(data.titles).exceptions,
      },
      exclusions: {
        method: (_old: any, data: any) => fromLegacy(data.titles).exclusions,
      },
    },
  },
};
