import { SrmBridge } from "../bridge";

declare global {
  interface Window {
    srm: SrmBridge;
  }
}

// The UI's only way out of its sandbox (set up by src/main/preload.ts).
// (Undefined outside Electron, e.g. in tests, which pass their own transport.)
export const bridge: SrmBridge = (globalThis as any).srm;
