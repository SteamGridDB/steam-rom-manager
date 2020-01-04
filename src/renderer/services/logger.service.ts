import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AlertMessage, LogMessage, MessageSettings, LogSettings } from '../../models';

@Injectable()
export class LoggerService {
    private alertMessage: BehaviorSubject<AlertMessage> = new BehaviorSubject<AlertMessage>(undefined);
    private logMessages: BehaviorSubject<LogMessage[]> = new BehaviorSubject<LogMessage[]>([]);
    private hideAfterNavigationChange: boolean = false;
    private logSettings: LogSettings;

    constructor(public datePipe: DatePipe) {
        this.logSettings = {
            showErrors: true,
            showInfo: true,
            showSuccesses: true,
            showFuzzy: false,
            autoscroll: false,
            textWrap: false,
            currentScrollValue: 0
        };
    }

    success(message: string, settings?: MessageSettings) {
        this.postMessage('success', message, settings);
    }

    info(message: string, settings?: MessageSettings) {
        this.postMessage('info', message, settings);
    }

    error(message: string | Error, settings?: MessageSettings) {
        this.postMessage('error', message, settings);
    }

    fuzzy(message: string, settings?: MessageSettings) {
        this.postMessage('fuzzy', message, settings);
    }

    private postMessage(type: 'success' | 'info' | 'error' | 'fuzzy', message: any, settings?: MessageSettings) {
        let keepAfterNavigationChange: boolean = false;
        let invokeAlert: boolean = false;
        let doNotAppendToLog: boolean = false;
        let alertTimeout: number = 0;

        if (settings) {
            invokeAlert = settings.invokeAlert !== undefined ? settings.invokeAlert : false;
            doNotAppendToLog = settings.doNotAppendToLog !== undefined ? settings.doNotAppendToLog : false;
            alertTimeout = settings.alertTimeout !== undefined ? settings.alertTimeout : 0;
        }

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
        return this.alertMessage.asObservable();
    }

    getLogMessages() {
        return this.logMessages.asObservable();
    }

    getLogSettings() {
        return this.logSettings;
    }
}
