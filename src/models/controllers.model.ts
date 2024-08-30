import { SteamDirList } from "./helpers.model";

export interface ControllerTemplate {
  title: string;
  mappingId: string;
  profileType: string;
}

export interface Controllers {
  [controllerType: string]: ControllerTemplate;
}

export type ControllerTemplates = SteamDirList<{
  [controllerType: string]: ControllerTemplate[];
}>;
