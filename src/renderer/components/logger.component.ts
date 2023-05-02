import { Component, AfterViewChecked, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { LoggerService } from '../services';
import { LogMessage, LogSettings } from '../../models';
import { Observable } from 'rxjs';
import { APP } from '../../variables';
import { clipboard } from 'electron';

import * as fs from 'fs-extra';

@Component({
  selector: 'log',

  templateUrl: '../templates/logger.component.html',
  styleUrls: [
    '../styles/logger.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoggerComponent {
  private messages: Observable<LogMessage[]>;
  private settings: LogSettings = undefined;
  private explanation: string;
  private reportID: string = undefined;
  private deleteKey: string = undefined;
  private useVDFs: boolean = false;
  private description: string = "";
  private discordHandle: string = "";
  private bugForm: FormGroup;

  @ViewChild('messageWindow') private messageWindow: ElementRef;

  constructor(
    private loggerService: LoggerService,
    private changeDetectionRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.settings = this.loggerService.getLogSettings();
    this.messages = this.loggerService.getLogMessages();
    this.explanation = this.lang.docs__md.self.join(' ');

    this.bugForm = formBuilder.group({
      description: formBuilder.control(''),
      discordHandle: formBuilder.control(''),
      useVDFs: formBuilder.control(false),
      steamDirectory: formBuilder.control('')
    })


  }

  get lang() {
    return APP.lang.logger.component;
  }

  ngAfterViewInit() {
    this.messages.subscribe((logMessages: LogMessage[]) => {
      this.changeDetectionRef.detectChanges();
    })
    if (this.settings.currentScrollValue && this.messageWindow)
      this.messageWindow.nativeElement.scrollTop = this.settings.currentScrollValue;
  }

  ngAfterViewChecked() {
    if (this.messageWindow) {
      if (this.settings.autoscroll)
        this.messageWindow.nativeElement.scrollTop = this.messageWindow.nativeElement.scrollHeight;
      this.settings.currentScrollValue = this.messageWindow.nativeElement.scrollTop;
    }
  }

  canShow(type: string) {
    switch (type) {
      case 'error':
        return this.settings.showErrors;
      case 'info':
        return this.settings.showInfo;
      case 'success':
        return this.settings.showSuccesses;
      case 'fuzzy':
        return this.settings.showFuzzy;
      default:
        return false;
    }
  }

  submitReport() {
    let description: string = this.bugForm.controls.description.value;
    let discordHandle: string = this.bugForm.controls.discordHandle.value;
    let useVDFs = this.bugForm.controls.useVDFs.value;
    let steamDirectory = this.bugForm.controls.steamDirectory.value;
    if( !description ) {
      this.loggerService.error(`Description cannot be blank. Please describe your issue.`);
      return;
    }
    if (useVDFs && (!steamDirectory||!fs.existsSync(steamDirectory))) {
      this.loggerService.error(`Valid steam directory is required to upload VDFs`);
      return;
    }
    this.loggerService.submitReport(description, useVDFs, discordHandle, steamDirectory).then(({key, deleteKey}:{key:string, deleteKey:string}) => {
      this.reportID = key;
      this.deleteKey = deleteKey;
      this.changeDetectionRef.detectChanges();
    }).catch((err)=>{
      this.loggerService.error(`Could not upload bug report:\n ${err}`)
    });


  }

  copyReportID() {
    clipboard.writeText(this.reportID);
  }

  copyDeleteKey() {
    clipboard.writeText(this.deleteKey);
  }

  clearLog() {
    this.loggerService.clearLog();
  }
}
