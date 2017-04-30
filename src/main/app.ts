import { app, BrowserWindow, dialog } from 'electron';
import { ThemeManager } from '../shared/theme-manager';
import * as paths from '../shared/paths'
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

let mainWindow: Electron.BrowserWindow = null;

function createWindow() {
    let themeManager = new ThemeManager();
    themeManager.readThemeTitle(true).then((colorThemeTitle) => {
        if (colorThemeTitle)
            return themeManager.readFromColorFile(colorThemeTitle, true);
        return false;
    }).then((read) => {
        mainWindow = new BrowserWindow({
            width: 1000, height: 600, minWidth: 800, minHeight: 600,
            frame: false, backgroundColor: themeManager.getColorRuleValue('main-body-background') || '#121212',
            webPreferences: {
                devTools: process.env.NODE_ENV !== 'production'
            }
        });
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'renderer', 'index.html'),
            protocol: 'file:',
            slashes: true
        }));
        mainWindow.on('closed', () => {
            mainWindow = null
        });

        if (read) {
            mainWindow.webContents.executeJavaScript(
                `
                    let css = '${themeManager.getCssString('')}';
                    let head = document.head;
                    let style = document.createElement('style');

                    style.id = 'userStyle';
                    style.appendChild(document.createTextNode(css));

                    let styleTags = document.head.getElementsByTagName('style');
                    if (styleTags.length)
                        head.insertBefore(style, styleTags[0]);
                    else
                        head.appendChild(style);
                `
            ).catch((error) => {
                throw error;
            });
        }
        else {
            mainWindow.show();
        }
    }).catch((error) => {
        dialog.showMessageBox({ type: 'error', title: 'Error reading current user theme or settings', message: error.message || error });
        app.quit();
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});