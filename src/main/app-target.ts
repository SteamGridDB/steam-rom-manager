import { BrowserWindow, dialog, shell, OpenDialogOptions } from "electron";
import * as fs from "fs-extra";
import * as paths from "../paths";

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
    openDialog: (options: OpenDialogOptions) =>
      dialog.showOpenDialog(window(), options),
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
