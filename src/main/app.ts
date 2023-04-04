import { app, BrowserWindow, shell, ipcMain, IpcMainEvent } from 'electron';
import * as log from 'electron-log';
import { autoUpdater, CancellationToken } from 'electron-updater';
import * as paths from "../paths";
import * as path from 'path';
import * as url from 'url';
import yargs, {Argv} from 'yargs';
import { hideBin } from 'yargs/helpers';

//Enable remote
require('@electron/remote/main').initialize()

// CLI Setup
//const argv = yargs(hideBin(process.argv)).argv

let commandCLI:string = '';
let argsCLI: string[] = [];
yargs(hideBin(process.argv))
.command('list','list all parsers',(yargs: typeof Argv)=>{
  commandCLI = 'list'
  return
})
.strict()
.parse();

// Logging setup
if(commandCLI) {
  log.info('In CLI')
  delete process.env.ELECTRON_ENABLE_SECURITY_WARNINGS;
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  process.env.ELECTRON_ENABLE_LOGGING='1';
  process.emitWarning = (warning, ...args) => {};
  log.transports.file.level='error';
} else {
  log.transports.file.level='info';
  log.info('App starting...');
}


// Auto updater setup
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
const cancellationToken = new CancellationToken();

// Window setup
const windowStateKeeper = require('electron-window-state');
let mainWindow: Electron.BrowserWindow = null;

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 600,
    maximize: false,
    path: paths.userDataDir
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width < 1024 ? 1024 : mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    backgroundColor: '#121212',
    webPreferences: {
      devTools: true,
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true
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
  mainWindow.show();
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
    mainWindow = new BrowserWindow({
      width: 0,
      height: 0,
      show: false,
      frame: false,
      backgroundColor: '#121212',
      webPreferences: {
        devTools: true,
        nodeIntegration: true,
        nodeIntegrationInWorker: true
      }
    });

    require("@electron/remote/main").enable(mainWindow.webContents);

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'renderer', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));
    ipcMain.on('parsers_list', (event: IpcMainEvent, plist) => {
      console.log('Parsers List: ', plist);
      app.quit();
    })
    ipcMain.on('log', (event: IpcMainEvent, loggable: any) => {
      console.log(loggable);
    })
    mainWindow.webContents.on('did-finish-load',()=>{
      if(commandCLI) {
        log.info("sending contents");
        console.log("other log type")
        mainWindow.webContents.send('cli_message',{command: commandCLI, args: argsCLI});
      } else {
        app.quit();
      }
    })

  } else {
    createWindow();
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
    //createWindow();
  }
});
