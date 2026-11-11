import { BrowserWindow, dialog, shell, OpenDialogOptions } from "electron";
import * as fs from "fs-extra";
import * as path from "path";
import * as paths from "../paths";

// The last picked folder, if it's still there.
async function lastFolder(): Promise<string | undefined> {
  try {
    const { folder } = await fs.readJson(paths.lastDialogFolder);
    return typeof folder === "string" && (await fs.pathExists(folder))
      ? folder
      : undefined;
  } catch {
    return undefined;
  }
}

// The "app" RPC target: what the UI needs from Electron itself (it has no
// access to Electron or Node).
export function appTarget(getWindow: () => BrowserWindow | null) {
  const window = () => {
    const w = getWindow();
    if (!w || w.isDestroyed()) {
      throw new Error("No window");
    }
    return w;
  };
  return {
    windowInfo: () => ({
      minimizable: window().minimizable,
      maximizable: window().maximizable,
    }),
    // Opens in the folder of the last pick (unless the caller says where):
    // since Electron 43 the dialogs don't remember it themselves.
    openDialog: async (options: OpenDialogOptions) => {
      const defaultPath = options.defaultPath ?? (await lastFolder());
      const result = await dialog.showOpenDialog(window(), {
        ...options,
        ...(defaultPath && { defaultPath }),
      });
      if (!result.canceled && result.filePaths.length) {
        const picked = result.filePaths[0];
        const folder = options.properties?.includes("openDirectory")
          ? picked
          : path.dirname(picked);
        await fs.outputJson(paths.lastDialogFolder, { folder }).catch(() => {});
      }
      return result;
    },
    // Shows a folder (SRM's userData by default) in the file manager. Only
    // folders: opening a file could run it.
    openFolder: async (dir: string = paths.userDataDir) => {
      if (!(await fs.stat(dir)).isDirectory()) {
        throw new Error(`Not a folder: ${dir}`);
      }
      const error = await shell.openPath(dir);
      if (error) {
        throw new Error(error);
      }
    },
    minimize: async () => {
      const w = window();
      if (w.isMinimized()) w.restore();
      else w.minimize();
    },
    toggleMaximize: async () => {
      const w = window();
      if (w.isMaximized()) w.unmaximize();
      else w.maximize();
    },
    close: async () => window().close(),
  };
}
