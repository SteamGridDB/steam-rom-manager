import { app, BrowserWindow, shell, ipcMain, IpcMainEvent, crashReporter } from 'electron';
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

// Crash Reporting
crashReporter.start({
  productName: 'steam-rom-manager',
  companyName: 'cbd',
  submitURL: 'https://cbd.sp.backtrace.io:6098/post?format=minidump&token=f2caa6949cf9a39cb04a0cfef310e0479f47e6cb070b3b0cd0f4d54b97281730',
  uploadToServer: true,
});

// CLI Setup
let commandCLI:string = '';
let argsCLI: string[];
let flagsCLI: {[k: string]: boolean} = {};

yargs(hideBin(process.argv))
.usage(clc.green(`Make sure Steam is fully exited before using add/remove/nuke.`))
.usage(clc.green(`If Steam is running apps will be added/removed, but categories won\'t.`))
.command('list', clc.blue('List all parsers and their enabled status.\nUsage: list'),(yargs: typeof Argv)=>{
  commandCLI = 'list'
  console.log("Fetching parsers...\n")
})
.example (`srm enable --names "name1" "name2"`)
.example (`srm disable --all; srm enable "id1" "id2"; srm remove;`)
.example("srm enable --all; srm add;")
.command('enable', clc.blue('Enable parsers by name or id.\nUsage: enable [p1] [p2]'),(yargs: typeof Argv)=> {
  return yargs.positional('parsers', {
    describe: clc.blue('List of parsers to enable (names or ids)'),
    type: 'string'
  }).option('all', {
    describe: clc.blue('Command enables all parsers if this flag is set.'),
    type: 'boolean'
  }).option('names', {
    describe: clc.blue('Flag tells SRM to enable by (emoji-stripped) name instead of id'),
    type: 'boolean'
  })
}, (argv: any) => {
  commandCLI='enable'
  argsCLI = argv._.slice(1);
  flagsCLI['all'] = !!argv.all;
  flagsCLI['names'] = !!argv.names;
})
.command('disable', clc.blue('Disable parsers by name or id.\nUsage: disable [p1] [p2]'), (yargs: typeof Argv) => {
  return yargs.positional('parsers', {
    describe: clc.blue('List of parsers to disable (names or ids)'),
    type: 'string'
  }).option('all', {
    describe: clc.blue('Command disables all parsers if this flag is set.'),
    type: 'boolean'
  }).option('names', {
    describe: clc.blue('Flag tells SRM to disable by (emoji-stripped) name instead of id'),
    type: 'boolean'
  })
}, (argv: any) => {
  commandCLI='disable'
  argsCLI = argv._.slice(1);
  flagsCLI['all'] = !!argv.all;
  flagsCLI['names'] = !!argv.names;
})
.command('add', clc.blue('Run all enabled parsers and save apps to steam.\nUsage: add'), (yargs: typeof Argv) => {
  commandCLI='add'
})
.command('remove', clc.blue('Run all enabled parsers and remove apps from steam.\nUsage: remove'), (yargs: typeof Argv) => {
  commandCLI='remove'
})
.command('nuke', clc.blue('Removes all SRM added changes to your steam library.\nUsage: nuke'), (yargs: typeof Argv)=> {
  commandCLI='nuke'
} )
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
  log.transports.console.level='info';
  console.log('App starting...');
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
// To test update component uncomment the two lines below.
//autoUpdater.forceDevUpdateConfig = true;
autoUpdater.on('checking-for-update', () => {
  console.log('checking for updates')
  //mainWindow.webContents.send('updater_message','update_portable')
})
autoUpdater.on('update-available', (info) => {
  console.log('update available')
  if(process.platform=='darwin' || process.env.PORTABLE_EXECUTABLE_DIR) {
    mainWindow.webContents.send('updater_message','update_portable');
  } else{
    mainWindow.webContents.send('updater_message','update_available');
  }
})

autoUpdater.on('error', (err) => {
  console.log(err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Progress: ' + Math.round(progressObj.percent) + '%';
  console.log(log_message)
  mainWindow.webContents.send('updater_message',{ progress: log_message });
})
autoUpdater.on('update-downloaded', (info) => {
  mainWindow.webContents.send('updater_message','update_downloaded');
});

// Main Listeners
app.on('ready', ()=>{
  if(commandCLI) {
    console.log("\n");
    createWindow(false);
    remoteMain.enable(mainWindow.webContents);

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'renderer', 'index.html'),
      protocol: 'file:',
      slashes: true
    }));

    ipcMain.on('parsers_list', (event: IpcMainEvent, plist: UserConfiguration[]) => {
      process.stdout.write(
        clc.columns([[clc.blue("Parser Title (w/o emoji)"), clc.blue("Parser ID"), clc.blue("Status")]].concat(
          plist.map((parser)=>[
            parser.configTitle.replace(/[^\x20-\x7E]+/g, ""),
            parser.parserId,
            parser.disabled ? clc.xterm(203)("Disabled") : clc.xterm(48)("Enabled")
          ])
        ))
      )
      app.quit();
    })
    ipcMain.on('all_done', (event: IpcMainEvent) => {
      console.log("\nAll Done")
      app.quit()
    })
    ipcMain.on('log', (event: IpcMainEvent, loggable: any) => {
      console.log(loggable);
    })
    ipcMain.on('inline-log',(event: IpcMainEvent, loggable: any) => {
      process.stdout.write(clc.erase.line);
      process.stdout.write(clc.move.lineBegin);
      process.stdout.write(loggable)
    })
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('cli_message',{
        command: commandCLI,
        args: argsCLI,
        flags: flagsCLI
      });
    });
  } else {
    createWindow(true);
    mainWindow.webContents.on('dom-ready',()=>{
      autoUpdater.checkForUpdatesAndNotify()
    });
    ipcMain.on('download_update', (event: IpcMainEvent)=>{
      autoUpdater.downloadUpdate(cancellationToken);
    })
    ipcMain.on('restart_app', (event: IpcMainEvent)=>{
      autoUpdater.quitAndInstall()
    })
    ipcMain.on('cancel_update', (event: IpcMainEvent)=>{
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
