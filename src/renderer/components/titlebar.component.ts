import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { remote } from 'electron';

@Component({
    selector: 'titlebar',
    templateUrl: '../templates/titlebar.component.html',
    styleUrls: [
        '../styles/titlebar.component.scss'
    ]
})
export class TitleComponent {
    private mainWindow: Electron.BrowserWindow;
    private minimizable: boolean;
    private maximizable: boolean;

    constructor(private title: Title) {
        this.mainWindow = remote.getCurrentWindow();
        this.minimizable = this.mainWindow.isMinimizable();
        this.maximizable = this.mainWindow.isMaximizable();
    }

    minimizeEvent() {
        if (this.minimizable) {
            if (this.mainWindow.isMinimized())
                this.mainWindow.restore();
            else
                this.mainWindow.minimize();
        }
    }

    maximizeEvent() {
        if (this.maximizable) {
            if (this.mainWindow.isMaximized())
                this.mainWindow.unmaximize();
            else
                this.mainWindow.maximize();
        }
    }

    closeEvent() {
        this.mainWindow.close();
    }

    getTitle(){
        return this.title.getTitle();
    }
}