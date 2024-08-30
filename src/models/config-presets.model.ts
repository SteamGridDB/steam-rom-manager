import { UserConfiguration } from "./user-configuration.model";

export interface ConfigPresets {
  [key: string]: UserConfiguration;
}
