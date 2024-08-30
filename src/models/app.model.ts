import { languageStruct } from "./language.model";

export interface GlobalContainer {
  lang: languageStruct;
  version: string;
  os: string;
  arch: string;
  srmdir: string;
}
