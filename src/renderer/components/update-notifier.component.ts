import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,Input } from '@angular/core';
import { IpcService } from '../services';

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
  constructor(private ipcService: IpcService, private changeDetectionRef: ChangeDetectorRef) {  }

  @Input()
  public set ipcMessage(message: any){
    this.handleUpdateNotification(message);
  }
  private closeNotification() {
    this.update = false;
  }
  private restartApp() {
    this.ipcService.send('restart_app')
  }
  private handleUpdateNotification(message: any){
    if(typeof(message)=='string' && message=='update_available'){
      this.update = true
    }
  }
}
