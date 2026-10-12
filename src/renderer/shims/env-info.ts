import { EnvInfo } from "../../bridge";
import { bridge } from "../bridge";

// Stands in for src/env-info.ts in the UI bundle (see webpack/renderer.ts).
export function envInfo(): EnvInfo {
  return bridge.env;
}
