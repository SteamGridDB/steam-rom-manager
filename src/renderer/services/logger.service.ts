import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject, BehaviorSubject } from 'rxjs';
import { AlertMessage, LogMessage, MessageSettings, LogSettings } from '../models';

@Injectable()
export class LoggerService {
    private alertMessage: Subject<AlertMessage> = new Subject<AlertMessage>();
    private logMessages: BehaviorSubject<LogMessage[]> = new BehaviorSubject<LogMessage[]>([]);
    private keepAfterNavigationChange: boolean = false;
    private logSettings: LogSettings;

    constructor(private router: Router, public datePipe: DatePipe) {
        router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                if (this.keepAfterNavigationChange)
                    this.keepAfterNavigationChange = false;
                else
                    this.alertMessage.next();
            }
        });
        this.logSettings = { 
            showErrors: true, 
            showInfo: true, 
            showSuccesses: true,
            showFuzzy: false,
            autoscroll: false, 
            textWrap: false, 
            timestamp: false, 
            currentScrollValue: 0
        };
    }

    success(message: string, settings?: MessageSettings) {
        this.postMessage('success', message, settings);
    }

    info(message: string, settings?: MessageSettings) {
        this.postMessage('info', message, settings);
    }

    error(message: string, settings?: MessageSettings) {
        this.postMessage('error', message, settings);
    }

    fuzzy(message: string, settings?: MessageSettings) {
        this.postMessage('fuzzy', message, settings);
    }

    private postMessage(type: 'success' | 'info' | 'error' | 'fuzzy', message: string, settings?: MessageSettings) {
        let keepAfterNavigationChange: boolean = false;
        let invokeAlert: boolean = false;
        let doNotAppendToLog: boolean = false;
        let alertTimeout: number = 0;

        if (settings) {
            keepAfterNavigationChange = settings.keepAfterNavigationChange !== undefined ? settings.keepAfterNavigationChange : false;
            invokeAlert = settings.invokeAlert !== undefined ? settings.invokeAlert : false;
            doNotAppendToLog = settings.doNotAppendToLog !== undefined ? settings.doNotAppendToLog : false;
            alertTimeout = settings.alertTimeout !== undefined ? settings.alertTimeout : 0;
        }

        this.keepAfterNavigationChange = keepAfterNavigationChange;

        if (invokeAlert) {
            this.alertMessage.next({
                type: type,
                text: message,
                timeout: alertTimeout
            });
        }

        if (!doNotAppendToLog) {
            let logMessages = this.logMessages.getValue();
            logMessages = logMessages.concat({
                timestamp: this.datePipe.transform(new Date().getTime(), 'HH:mm:ss'),
                type: type,
                text: message
            });
            this.logMessages.next(logMessages);
        }
    }

    clearLog() {
        this.logMessages.next([]);
    }

    getAlertMessage() {
        return this.alertMessage;
    }

    getLogMessages() {
        return this.logMessages;
    }

    getLogSettings() {
        return this.logSettings;
    }
}