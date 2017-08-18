import { Injectable } from '@angular/core';
import { readJson, writeJson } from "../../shared/lib";
import { availableProviders } from '../lib/image-providers';
import { AppSettings } from "../models";
import { LoggerService } from './logger.service';
import { Subject, BehaviorSubject } from "rxjs";
import { gApp } from "../app.global";
import * as _ from "lodash";
import * as paths from '../../shared/paths';

@Injectable()
export class SettingsService {
    private changeSubject: Subject<AppSettings> = new Subject();
    private settingsLoadedSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private appSettings: AppSettings;

    constructor(private loggerService: LoggerService) {
        this.appSettings = {
            fuzzyMatcher: {
                timestamps: {
                    check: 0,
                    download: 0
                },
                verbose: false,
                filterProviders: true
            },
            previewSettings: {
                retrieveCurrentSteamImages: true,
                imageZoomPercentage: 40,
                preload: false
            },
            enabledProviders: availableProviders(),
            language: 'English',
            offlineMode: false,
            knownSteamDirectories: []
        };

        readJson<AppSettings>(paths.userSettings, this.appSettings).then((settings) => {
            this.appSettings = this.validateObject(settings, this.appSettings);
        }).catch((error) => {
            this.loggerService.error(this.lang.error.readingError, { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
        }).then(() => {
            this.settingsLoadedSubject.next(true);
        });
    }

    private get lang() {
        return gApp.lang.settings.service;
    }

    getSettings() {
        return this.appSettings;
    }

    settingsChanged() {
        this.changeSubject.next(this.appSettings);
    }

    getChangeObservable() {
        return this.changeSubject.asObservable();
    }

    saveAppSettings() {
        writeJson(paths.userSettings, this.appSettings).then().catch((error) => {
            this.loggerService.error(this.lang.error.writingError, { invokeAlert: true, alertTimeout: 3000 });
            this.loggerService.error(error);
        });
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

    onLoad(callback: (appSettings: AppSettings) => void) {
        this.settingsLoadedSubject.asObservable().takeWhile((loaded) => {
            if (loaded)
                callback(this.appSettings);

            return !loaded;
        }).subscribe();
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