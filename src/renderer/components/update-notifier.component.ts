import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,Input } from '@angular/core';
import { IpcService } from '../services';

@Component({
  selector: 'update-notifier',
  template: `
            <div id="updateNotification">
              <p id="message">{{messageText}}</p>
              <button id="no-button" (click)= "showUpdater=false" [class.hidden]="initiatedDownload">No</button>
              <button id="yes-button" (click)="downloadUpdate()" [class.hidden]="initiatedDownload">Yes</button>
              <button id="cancel-button" (click)="cancelUpdate()" [class.hidden]="!initiatedDownload">Cancel</button>
              <button id="restart-button" (click)="restartApp()" [class.hidden]="!downloadComplete">Restart</button>
            </div>
    `,
  styleUrls: ['../styles/update-notifier.component.scss'],
  host: {
    '[class.hidden]':'!showUpdater'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class UpdateNotifierComponent {
  private showUpdater: boolean = false;
  private initiatedDownload: boolean = false;
  private downloadComplete: boolean = false;
  private messageText: string = '';
  constructor(private ipcService: IpcService, private changeDetectionRef: ChangeDetectorRef) {  }

  @Input()
  public set ipcMessage(message: any){
    this.handleUpdateNotification(message);
  }
  private restartApp() {
    this.ipcService.send('restart_app')
  }
  private downloadUpdate(){
    this.ipcService.send('download_update');
    this.initiatedDownload = true;
  }
  private cancelUpdate() {
    this.ipcService.send('cancel_update');
    this.showUpdater = false;
  }
  private handleUpdateNotification(message: any){
    if(typeof(message)=='string' && message=='update_available'){
      this.showUpdater = true;
      this.messageText = 'An update is available. Download it now?'
    }
    else if(typeof(message)=='string' && message=='update_downloaded') {
      this.downloadComplete=true;
      this.messageText = 'Update downloaded. Restart now?'
    }
    else if(typeof(message)=='object') {
      if(message['progress']) {
        this.messageText= message['progress'];
      }
    }
  }
}
