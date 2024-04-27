import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy,Input, ComponentFactoryResolver } from '@angular/core';
import { AppSettings } from '../../models';
import { IpcService, SettingsService } from '../services';

@Component({
  selector: 'update-notifier',
  template: `
            <div id="updateNotification">
              <div class="update-notifier-content">
              <p id="message" [innerHTML]="messageText"></p>
              <div id="no-button" class="noButton" (click)= "showUpdater=false" [class.hidden]="initiatedDownload">{{isPortableUpdate?'Close':'No'}}</div>
              <div id="yes-button" class="goButton" (click)="downloadUpdate()" [class.hidden]="initiatedDownload||isPortableUpdate">Yes</div>
              <div id="cancel-button" class="noButton" (click)="cancelUpdate()" [class.hidden]="!initiatedDownload">Cancel</div>
              <div id="restart-button" class="goButton" (click)="restartApp()" [class.hidden]="!downloadComplete">Restart</div>
              </div>
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
  private isPortableUpdate: boolean = false;
  private initiatedDownload: boolean = false;
  private downloadComplete: boolean = false;
  private messageText: string = '';
  private appSettings: AppSettings;
  constructor(private ipcService: IpcService, private settingsService: SettingsService,private changeRef: ChangeDetectorRef) {  
    this.appSettings = this.settingsService.getSettings();
  }

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
    if(!this.appSettings.autoUpdate) {
      return
    }
    if(this.appSettings.emudeckInstall && typeof(message) == 'string' && message == 'update_portable') {
      this.showUpdater = true;
      this.messageText = 'An update is available, please update via EmuDeck.'
      this.isPortableUpdate = true;
    } else {
      if(typeof(message)=='string' && message=='update_available'){
        this.showUpdater = true;
        this.messageText = 'An update is available. Download it now?'
      }
      else if(typeof(message)=='string' && message=='update_portable'){
        this.showUpdater = true;
        this.isPortableUpdate = true;
        this.messageText = 'An update is available. <a href="https://github.com/SteamGridDB/steam-rom-manager/releases/latest">Download it now?</a>'
      }
      else if(typeof(message)=='string' && message=='update_downloaded') {
        this.downloadComplete=true;
        this.messageText = 'Update downloaded. Restart now?'
      }
      else {
        if(message['progress']) {
          this.messageText= message['progress'];
          this.changeRef.detectChanges();
        }
      }
    }
  }
}
