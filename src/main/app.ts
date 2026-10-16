import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  IpcMainEvent,
  crashReporter,
  net,
} from "electron";
import * as log from "electron-log";
import { autoUpdater, CancellationToken } from "electron-updater";
import * as paths from "../paths";
import * as path from "path";
import * as url from "url";
import { hideBin } from "yargs/helpers";
import { setDefaultFetch } from "../core/http";
import { envInfo } from "../env-info";
import { envChannel } from "../bridge";
import { runCli } from "./cli";
import { parseCliArgs } from "./cli-args";
import { startCoreForWindow } from "./core-host";
import { spawnSync } from "child_process";

// Chromium reserves --type for its own processes (--type=renderer, ...):
// given the CLI's --type, this main process takes itself for one of them.
// Rerun the same command with --type spelled --parser-type (an alias).
const reserved = (arg: string) => arg === "--type" || arg.startsWith("--type=");
if (hideBin(process.argv).some(reserved)) {
  const args = process.argv
    .slice(1)
    .map((arg) =>
      reserved(arg) ? arg.replace("--type", "--parser-type") : arg,
    );
  const rerun = spawnSync(process.execPath, args, { stdio: "inherit" });
  process.exit(rerun.status ?? 1);
}

// Crash Reporting
crashReporter.start({
  productName: "steam-rom-manager",
  companyName: "cbd",
  submitURL:
    "https://cbd.sp.backtrace.io:6098/post?format=minidump&token=f2caa6949cf9a39cb04a0cfef310e0479f47e6cb070b3b0cd0f4d54b97281730",
  uploadToServer: true,
});

// Command line: a command runs headless; without one the window opens.
const cliRequest = parseCliArgs(hideBin(process.argv));

// Logging setup
if (cliRequest) {
  delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
  process.emitWarning = (warning, ...args) => {};
  log.transports.file.level = "error";
  log.transports.console.level = "error";
  // The CLI runs headless; no window, no GPU.
  app.disableHardwareAcceleration();
  // Chromium's own data (caches, cookies; not SRM's data) apart from the
  // window's: sharing it with an open SRM window logs cache errors.
  app.setPath(
    "sessionData",
    path.join(app.getPath("temp"), "steam-rom-manager-cli"),
  );
} else {
  log.transports.file.level = "info";
  log.transports.console.level = "info";
  console.log("App starting...");
}

// Auto updater setup
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
const cancellationToken = new CancellationToken();

// Window setup
const windowStateKeeper = require("electron-window-state");
let mainWindow: Electron.BrowserWindow = null;

function createWindow(show: boolean) {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 600,
    maximize: false,
    path: paths.userDataDir,
  });
  let minWidth = 800;
  mainWindow = new BrowserWindow({
    x: show ? mainWindowState.x : undefined,
    y: show ? mainWindowState.y : undefined,
    width: show
      ? mainWindowState.width < minWidth
        ? minWidth
        : mainWindowState.width
      : 0,
    height: show ? mainWindowState.height : 0,
    minWidth: show ? minWidth : undefined,
    minHeight: show ? 600 : undefined,
    frame: false,
    show: show,
    backgroundColor: "#121212",
    // The UI has no Node or Electron access: it reaches the main process
    // only through the preload's window.srm (see src/bridge.ts).
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, "preload.bundle.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "renderer", "index.html"),
      protocol: "file:",
      slashes: true,
    }),
  );
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Links open in the user's browser, never inside SRM.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    openExternal(url);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: "deny" };
  });
  if (show) {
    mainWindow.show();
  }
}

function openExternal(url: string) {
  if (/^(https?|mailto):/i.test(url)) {
    shell.openExternal(url);
  }
}

// Auto Updater Listeners
// To test update component uncomment the two lines below.
//autoUpdater.forceDevUpdateConfig = true;
autoUpdater.on("checking-for-update", () => {
  console.log("checking for updates");
  //mainWindow.webContents.send('updater_message','update_portable')
});
autoUpdater.on("update-available", (info) => {
  console.log("update available");
  if (process.platform == "darwin" || process.env.PORTABLE_EXECUTABLE_DIR) {
    mainWindow.webContents.send("updater_message", "update_portable");
  } else {
    mainWindow.webContents.send("updater_message", "update_available");
  }
});

autoUpdater.on("error", (err) => {
  console.log(err);
});
autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Progress: " + Math.round(progressObj.percent) + "%";
  console.log(log_message);
  mainWindow.webContents.send("updater_message", { progress: log_message });
});
autoUpdater.on("update-downloaded", (info) => {
  mainWindow.webContents.send("updater_message", "update_downloaded");
});

// Main Listeners
app.on("ready", async () => {
  // Network I/O in the core (SteamGridDB, GitHub, Steam Web API) uses
  // Electron's network stack: system certificate store and proxy, which
  // Node's TLS (e.g. node-fetch) doesn't honour on some systems.
  setDefaultFetch((url, init) => net.fetch(url, init as RequestInit) as any);
  if (cliRequest) {
    // Headless: the CLI runs the core directly in this process.
    let code = 1;
    try {
      code = await runCli(cliRequest);
    } catch (error) {
      process.stderr.write(`${error?.stack ?? error}\n`);
    }
    app.exit(code);
  } else {
    // The GUI's business logic runs here; the window is its UI.
    const env = envInfo();
    ipcMain.on(envChannel, (event) => {
      event.returnValue = env;
    });
    const core = startCoreForWindow(() => mainWindow);
    if (process.platform === "win32") {
      core.shellScripts.download();
    }
    app.on("before-quit", () => {
      core.fuzzy.saveCacheIfNeeded();
    });
    createWindow(true);
    // Let the fuzzy matcher's cache reach the disk before the window goes.
    let cacheSaved = false;
    mainWindow.on("close", (event) => {
      if (cacheSaved) return;
      event.preventDefault();
      core.fuzzy
        .saveCacheIfNeeded()
        .catch((e: unknown) => log.error(e))
        .finally(() => {
          cacheSaved = true;
          mainWindow?.close();
        });
    });
    mainWindow.webContents.on("dom-ready", () => {
      autoUpdater.checkForUpdatesAndNotify();
    });
    ipcMain.on("download_update", (event: IpcMainEvent) => {
      autoUpdater.downloadUpdate(cancellationToken);
    });
    ipcMain.on("restart_app", (event: IpcMainEvent) => {
      autoUpdater.quitAndInstall();
    });
    ipcMain.on("cancel_update", (event: IpcMainEvent) => {
      cancellationToken.cancel();
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow(!cliRequest);
  }
});
