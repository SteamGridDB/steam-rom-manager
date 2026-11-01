import { languageStruct } from "./language.model";
import type { OsType } from "../bridge";

export interface GlobalContainer {
  lang: languageStruct;
  version: string;
  os: string;
  osType: OsType;
  arch: string;
  srmdir: string;
}
