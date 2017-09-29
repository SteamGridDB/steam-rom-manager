import { Component, AfterViewChecked, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { LoggerService } from '../services';
import { LogMessage, LogSettings } from '../models';
import { Observable } from 'rxjs';
import { gApp } from "../app.global";

@Component({
    selector: 'log',
    template: `
        <ng-container *ngIf="messages | async as currentMessages; else emptyWindow">
            <ng-container *ngIf="currentMessages.length > 0; else emptyWindow">
                <div #messageWindow class="messages">
                    <ng-container *ngFor="let message of currentMessages">
                        <div *ngIf="canShow(message.type)" [ngClass]="message.type" [class.wrap]="settings.textWrap">{{message.text || '&nbsp;'}}</div>
                    </ng-container>
                </div>
            </ng-container>
        </ng-container>
        <ng-template #emptyWindow>
            <div class="messages empty">
                <span>No messages are available</span>
            </div>
        </ng-template>
        <div class="menu">
            <div class="error" [class.active]="settings.showErrors" (click)="settings.showErrors = !settings.showErrors">{{lang.error}}</div>
            <div class="info" [class.active]="settings.showInfo" (click)="settings.showInfo = !settings.showInfo">{{lang.info}}</div>
            <div class="success" [class.active]="settings.showSuccesses" (click)="settings.showSuccesses = !settings.showSuccesses">{{lang.success}}</div>
            <div class="fuzzy" [class.active]="settings.showFuzzy" (click)="settings.showFuzzy = !settings.showFuzzy">{{lang.fuzzy}}</div>
            <div class="textWrap" [class.active]="settings.textWrap" (click)="settings.textWrap = !settings.textWrap">{{lang.textWrap}}</div>
            <div class="autoscroll" [class.active]="settings.autoscroll" (click)="settings.autoscroll = !settings.autoscroll">{{lang.autoscroll}}</div>
            <div class="clear" (click)="clearLog()">{{lang.clearLog}}</div>
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

    get lang(){
        return gApp.lang.logger.component;
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

    clearLog() {
        this.loggerService.clearLog();
    }
}