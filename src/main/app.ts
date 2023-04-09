import { app, BrowserWindow, shell, ipcMain, IpcMainEvent } from 'electron';
import * as log from 'electron-log';
import * as remoteMain from '@electron/remote/main';
import { autoUpdater, CancellationToken } from 'electron-updater';
import * as paths from "../paths";
import * as path from 'path';
import * as url from 'url';
import * as clc from "cli-color"
import yargs, {Argv} from 'yargs';
import { hideBin } from 'yargs/helpers';
import { UserConfiguration } from '../models'


// CLI Setup
//const argv = yargs(hideBin(process.argv)).argv

let commandCLI:string = '';
let argsCLI: string[] = [];
yargs(hideBin(process.argv))
.command('list','list all parsers',(yargs: typeof Argv)=>{
  commandCLI = 'list'
  console.log("\nFetching parsers...")
})
.command('enable', 'enable parsers by name or id. Usage: enable "P1" "P2"',(yargs: typeof Argv)=> {
  commandCLI='enable'
  log.info("args: ", yargs)
})
.command('disable', 'disable parsers by name or id. Usage: disable "P1 "P2"', (yargs: typeof Argv) => {
  commandCLI='disable'
  log.info("args: ", yargs)
})
.strict()
.parse();

// Logging setup
if(commandCLI) {
  delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  process.env.ELECTRON_ENABLE_LOGGING='true';
  process.emitWarning = (warning, ...args) => {};
  log.transports.file.level = 'error';
  log.transports.console.level = 'error';
} else {
  log.transports.file.level='info';
  log.info('App starting...');
}

//Enable remote
remoteMain.initialize()



// Auto updater setup
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
const cancellationToken = new CancellationToken();

// Window setup
const windowStateKeeper = require('electron-window-state');
let mainWindow: Electron.BrowserWindow = null;

function createWindow(show: boolean) {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 600,
    maximize: false,
    path: paths.userDataDir
  });

  mainWindow = new BrowserWindow({
    x: show ? mainWindowState.x : undefined,
    y: show ? mainWindowState.y : undefined,
    width: show ? (mainWindowState.width < 1024 ? 1024 : mainWindowState.width) : 0,
    height: show ? (mainWindowState.height) : 0,
    minWidth: show ? 1024 : undefined,
    minHeight: show ? 600 : undefined,
    frame: false,
    show: show,
    backgroundColor: '#121212',
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      webSecurity: false
    }
  });
  require("@electron/remote/main").enable(mainWindow.webContents);

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  mainWindow.on('closed', () => {
    mainWindow = null
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
  if(show) {
    mainWindow.show();
  }
}

// Auto Updater Listeners
autoUpdater.on('checking-for-update', () => {
  log.info('checking for updates')
})
autoUpdater.on('update-available', (info) => {
  log.info('update available')
  if(process.platform=='darwin' || process.env.PORTABLE_EXECUTABLE_DIR) {
    mainWindow.webContents.send('updater_message','update_portable');
  } else{
    mainWindow.webContents.send('updater_message','update_available');
  }
})

autoUpdater.on('error', (err) => {
  log.info(err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Progress: ' + Math.round(progressObj.percent) + '%';
  log.info(log_message)
  mainWindow.webContents.send('updater_message',{ progress: log_message });
})
autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('updater_message','update_downloaded');
});

// Main Listeners
app.on('ready', ()=>{
  if(commandCLI) {
    createWindow(false);
    remoteMain.enable(mainWindow.webContents);

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'renderer', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    ipcMain.on('parsers_list', (event: IpcMainEvent, plist: UserConfiguration[]) => {
      process.stdout.write(
        clc.columns([[clc.bold("Parser Title (w/o emoji)"), clc.bold("Parser ID"), clc.bold("Status")]].concat(
          plist.map((parser)=>[
            parser.configTitle.replace(/[^\x20-\x7E]+/g, ""),
            parser.parserId,
            parser.disabled ? clc.xterm(203)("Disabled") : clc.xterm(48)("Enabled")
          ])
        ))
      )
      app.quit();
    })
    ipcMain.on('log', (event: IpcMainEvent, loggable: any) => {
      console.log(loggable);
    })
    mainWindow.webContents.on('did-finish-load',()=>{
      mainWindow.webContents.send('cli_message',{command: commandCLI, args: argsCLI});
    })
  } else {
    createWindow(true);
    mainWindow.webContents.on('dom-ready',()=>{
      autoUpdater.checkForUpdatesAndNotify()
    });
    ipcMain.on('download_update', (event: IpcMainEvent)=>{
      log.info('downloading update')
      autoUpdater.downloadUpdate(cancellationToken);
    })
    ipcMain.on('restart_app', (event: IpcMainEvent)=>{
      log.info('restarting and installing update');
      autoUpdater.quitAndInstall()
    })
    ipcMain.on('cancel_update', (event: IpcMainEvent)=>{
      log.info('cancelling update');
      cancellationToken.cancel()
    })

  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow(!commandCLI);
  }
});
