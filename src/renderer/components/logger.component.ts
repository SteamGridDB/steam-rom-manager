import { Component, AfterViewChecked, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { LoggerService } from '../services';
import { LogMessage, LogSettings } from '../../models';
import { Observable } from 'rxjs';
import { APP } from '../../variables';
import { clipboard } from 'electron';

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

  @ViewChild('messageWindow') private messageWindow: ElementRef;

  constructor(private loggerService: LoggerService) {
    this.settings = this.loggerService.getLogSettings();
    this.messages = this.loggerService.getLogMessages();
    this.explanation = this.lang.docs__md.self.join(' ');
  }

  get lang() {
    return APP.lang.logger.component;
  }

  ngAfterViewInit() {
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
    console.log("submitting report");
    Promise.resolve()
      .then(()=>{
        this.reportID = Math.floor(Math.random()*100000).toString();
      })
    //this.loggerService.submitReport();
  }
  copyReportID() {
    clipboard.writeText(this.reportID);
  }

  clearLog() {
    this.loggerService.clearLog();
  }
}
