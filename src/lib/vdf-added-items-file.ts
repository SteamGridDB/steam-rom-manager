import { VDF_AddedItemsData } from "../models";
import { VDF_Error } from "./vdf-error";
import { APP } from "../variables";
import * as json from "./helpers/json";
import * as _ from "lodash";
import * as fs from "fs-extra";
import * as path from "path";

export class VDF_AddedItemsFile {
  private fileData: VDF_AddedItemsData = undefined;

  constructor(private filePath: string) {}

  get data() {
    return this.fileData;
  }

  set data(value: VDF_AddedItemsData) {
    this.fileData = value;
  }

  get valid() {
    return this.fileData !== undefined;
  }

  get invalid() {
    return !this.valid;
  }

  read() {
    const modifierLatest = 2;
    const modifier = {
      "0": {
        method: (readData: any) => {
          return {
            version: 1,
            addedApps: Object.fromEntries(
              readData.map((x: string) => [
                x.split("_")[0],
                {
                  parserId: x.split("_")[1],
                  artworkOnly: x.split("_")[0].length < 17,
                },
              ]),
            ),
          };
        },
      },
      "1": {
        method: (readData: any) => {
          const addedApps = _.cloneDeep(readData.addedApps);
          const entries = Object.entries(addedApps).map(
            ([k, v]: [k: string, v: any]) => [k, { ...v, categories: [] }],
          );
          const addedAppsWithCats = Object.fromEntries(entries);
          const result = {
            version: 2,
            addedApps: addedAppsWithCats,
          };
          return result;
        },
      },
    };
    return json
      .read<any>(this.filePath, {})
      .then((readData) => {
        let controlVersion;
        if (Array.isArray(readData) || !readData.version) {
          controlVersion = 0;
        } else {
          controlVersion = readData.version;
        }
        let result = _.cloneDeep(readData);
        for (let j = controlVersion; j < modifierLatest; j++) {
          result =
            modifier[j.toString() as keyof typeof modifier].method(result);
        }
        this.fileData = result;
        return this.data;
      })
      .catch((error) => {
        this.fileData = { version: modifierLatest, addedApps: {} };
      });
  }

  write() {
    this.fileData.addedApps = _.pickBy(
      this.fileData.addedApps,
      (item) => item !== undefined,
    );
    return json.write(this.filePath, this.fileData);
  }

  getItem(appId: string) {
    return this.fileData.addedApps[appId];
  }

  removeItem(appId: string) {
    if (this.fileData.addedApps[appId] !== undefined) {
      this.fileData.addedApps[appId] = undefined;
    }
  }

  clear() {
    this.fileData.addedApps = {};
  }

  addItem(
    appId: string,
    parserId: string,
    artworkOnly: boolean,
    categories: string[],
  ) {
    this.fileData.addedApps[appId] = {
      parserId: parserId,
      artworkOnly: artworkOnly,
      categories: categories,
    };
  }
}
