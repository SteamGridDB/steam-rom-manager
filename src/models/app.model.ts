import { languageStruct } from "./language.model";

export interface GlobalContainer {
  lang: languageStruct;
  version: string;
  os: string;
  // os.type(): "Windows_NT", "Linux", "Darwin"
  osType: string;
  arch: string;
  srmdir: string;
}
