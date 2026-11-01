import * as fs from "fs-extra";
import * as _ from "lodash";
import { CustomVariables, Logger } from "../models";
import { APP } from "../variables";
import * as json from "../lib/helpers/json";
import * as paths from "../paths";
import * as schemas from "./schemas";
import { Fetch } from "./http";
import { DownloadedJsonStore } from "./downloaded-json-store";

// Custom variables: SRM's (files/customvariables on GitHub master, cached in
// customVariables.json) merged with the user's own userVariables.json, whose
// entries win.
export class CustomVariablesStore extends DownloadedJsonStore<CustomVariables> {
  constructor(logger: Logger, fetch: Fetch) {
    super(logger, fetch, new json.Validator(schemas.customVariables));
  }

  protected get localFile() {
    return paths.customVariables;
  }

  protected get lang() {
    return APP.lang.customVariables.service;
  }

  protected get repoDir() {
    return "files/customvariables";
  }

  protected async downloadRef() {
    return "master";
  }

  protected async fromCache(
    srmVariables: CustomVariables | null,
  ): Promise<CustomVariables> {
    if (!fs.existsSync(paths.userVariables)) {
      await json.write(paths.userVariables, {});
    }
    const userVariables =
      (await json.read<CustomVariables>(paths.userVariables)) || {};
    srmVariables = srmVariables || {};
    return Object.fromEntries(
      _.uniq([...Object.keys(srmVariables), ...Object.keys(userVariables)]).map(
        (key) => [key, { ...srmVariables[key], ...userVariables[key] }],
      ),
    );
  }
}
