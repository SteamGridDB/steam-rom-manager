import { Injectable } from '@angular/core';
import { readJson, writeJson } from "../lib";
import { AppSettings } from "../models";
import { LoggerService } from './logger.service';
import { Subject, BehaviorSubject } from "rxjs";
import * as _ from "lodash";
import * as paths from '../../shared/paths';

@Injectable()
export class SettingsService {
    private changeSubject: Subject<any> = new Subject();
    private settingsLoadedSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private appSettings: AppSettings = {
        fuzzyMatcher: {
            timestamps: {
                check: 0,
                download: 0
            },
            verbose: false,
            filterProviders: true
        },
        previewSettings: {
            imageZoomPercentage: 40,
            preload: false
        },
        offlineMode: false,
        knownSteamDirectories: []
    };

    constructor(private loggerService: LoggerService) {
        readJson<AppSettings>(paths.userSettings, this.appSettings).then((settings) => {
            this.appSettings = this.validateObject(settings, this.appSettings);
            this.settingsLoadedSubject.next(true);
        }).catch((error) => {
            this.settingsLoadedSubject.next(true);
            this.loggerService.error('Error occurred while reading user settings.', { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
        });
    }

    getSettings() {
        return this.appSettings;
    }

    settingsChanged() {
        this.changeSubject.next();
    }

    getChangeObservable() {
        return this.changeSubject.asObservable();
    }

    saveAppSettings() {
        writeJson(paths.userSettings, this.appSettings);
    }

    validateObject<template>(source: any, templateToMatch: template, keepNotFoundData?: string[]) {
        let validatedObject: any = {};

        if (keepNotFoundData !== undefined) {
            if (keepNotFoundData.length === 0)
                validatedObject = source;
            else {
                for (var i = 0; i < keepNotFoundData.length; i++) {
                    if (source[keepNotFoundData[i]] !== undefined)
                        validatedObject[keepNotFoundData[i]] = source[keepNotFoundData[i]];
                }
            }
        }

        for (let key in templateToMatch) {
            if (source[key] === undefined) {
                validatedObject[key] = templateToMatch[key];
            }
            else {
                if (_.isPlainObject(source[key]) && _.isPlainObject(templateToMatch[key]))
                    validatedObject[key] = _.merge(validatedObject[key], this.validateObject<any>(source[key], templateToMatch[key], keepNotFoundData));
                else if (this.isSameType(source[key], templateToMatch[key])) {
                    if (validatedObject[key] === undefined)
                        validatedObject[key] = source[key];
                }
                else {
                    validatedObject[key] = templateToMatch[key];
                }
            }
        }
        return validatedObject;
    }

    getLoadStatusObservable() {
        return this.settingsLoadedSubject.asObservable();
    }

    private isSameType(a: any, b: any) {
        return (a instanceof Array && b instanceof Array) ||
            (a === null && b === null) ||
            (typeof a === typeof b &&
                b !== null &&
                a !== null &&
                !(a instanceof Array) &&
                !(b instanceof Array)
            );
    }
}