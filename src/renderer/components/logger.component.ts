import { Component, AfterViewChecked, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { LoggerService } from '../services';
import { LogMessage, LogSettings } from '../models';
import { Observable } from 'rxjs';

@Component({
    selector: 'log',
    template: `
        <ng-container *ngIf="messages | async as currentMessages; else emptyWindow">
            <ng-container *ngIf="currentMessages.length > 0; else emptyWindow">
                <div #messageWindow id="messages">
                    <ng-container *ngFor="let message of currentMessages">
                        <div *ngIf="canShow(message.type)" [ngClass]="message.type" [class.wrap]="settings.textWrap">{{settings.timestamp ? '[' + message.timestamp + ']: ' : ''}}{{message.text || '&nbsp;'}}</div>
                    </ng-container>
                </div>
            </ng-container>
        </ng-container>
        <ng-template #emptyWindow>
            <div id="messages" class="empty">
                <span>No messages are available</span>
            </div>
        </ng-template>
        <div id="menu">
            <div class="error" [class.active]="settings.showErrors" (click)="settings.showErrors = !settings.showErrors">ERROR</div>
            <div class="info" [class.active]="settings.showInfo" (click)="settings.showInfo = !settings.showInfo">INFO</div>
            <div class="success" [class.active]="settings.showSuccesses" (click)="settings.showSuccesses = !settings.showSuccesses">SUCCESS</div>
            <div class="timestamp" [class.active]="settings.timestamp" (click)="settings.timestamp = !settings.timestamp">TIMESTAMP</div>
            <div class="textWrap" [class.active]="settings.textWrap" (click)="settings.textWrap = !settings.textWrap">TEXT-WRAP</div>
            <div class="autoscroll" [class.active]="settings.autoscroll" (click)="settings.autoscroll = !settings.autoscroll">AUTOSCROLL</div>
            <div class="clear" (click)="clearLog()">Clear log</div>
        </div>
    `,
    styleUrls: [
        '../styles/logger.component.scss'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoggerComponent {
    private messages: Observable<LogMessage[]>;
    private settings: LogSettings = undefined;

    @ViewChild('messageWindow') private messageWindow: ElementRef;

    constructor(private loggerService: LoggerService) {
        this.settings = this.loggerService.getLogSettings();
        this.messages = this.loggerService.getLogMessages();
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
            default:
                return false;
        }
    }

    clearLog() {
        this.loggerService.clearLog();
    }
}