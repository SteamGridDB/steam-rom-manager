import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,Input } from '@angular/core';
import { IpcRenderer } from 'electron';

@Component({
  selector: 'update-notifier',
  template: `
            <div id="updateNotification">
              <p id="message"></p>
              <button id="close-button" (click)="closeNotification()">Close</button>
              <button id="restart-button" (click)="restartApp()">Restart</button>
            </div>
    `,
  styleUrls: ['../styles/update-notifier.component.scss'],
  host: {
    '[class.hidden]':'!update'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class UpdateNotifierComponent {
  private update: boolean = false;
  private _ipc: IpcRenderer | undefined = void 0;
  constructor(private changeDetectionRef: ChangeDetectorRef) {
    this._ipc = require('electron').ipcRenderer;
  }

  @Input()
  public set ipcMessage(message: any){
    console.log(message)
    if(message=='update_available'){
      this.update = true
    }
  }
  private closeNotification() {
    console.log('closing')
    this.update = false;
  }
  private restartApp() {
    console.log('restarting')
    this._ipc.send('restart_app')
  }
}
