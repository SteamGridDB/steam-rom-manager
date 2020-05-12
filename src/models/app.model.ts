import { languageStruct } from "./language.model";

export interface GlobalContainer {
    lang: languageStruct,
    version: number,
    os: string,
    arch: string,
    srmpath: string
};
