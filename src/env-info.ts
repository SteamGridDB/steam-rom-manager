import * as os from "os";
import osName from "os-name";
import { EnvInfo } from "./bridge";

// Facts about the OS SRM runs on. (The UI bundle replaces this module with
// renderer/shims/env-info.ts, which asks the main process.)
export function envInfo(): EnvInfo {
  let name: string;
  try {
    name = osName(os.platform(), os.release());
  } catch (e) {
    name = `${os.platform()} (${os.release()})`;
  }
  return {
    osType: os.type(),
    osName: name,
    arch: os.arch(),
    portableDir: process.env.PORTABLE_EXECUTABLE_DIR || "",
  };
}
