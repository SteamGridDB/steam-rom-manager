import { Injectable } from '@angular/core';
import { FuzzyService } from './fuzzy.service';
import { LoggerService } from './logger.service';
import { SettingsService } from './settings.service';
import { AppSettings } from '../models';
import { ImageProvider } from "../lib";

@Injectable()
export class ImageProviderService {
    private imageProvider: ImageProvider;

    constructor(private fuzzyService: FuzzyService, private loggerService: LoggerService, private settingsService: SettingsService) {
        this.imageProvider = new ImageProvider(this.fuzzyService, this.loggerService);

        this.settingsService.onLoad((appSettings: AppSettings) => {
            this.imageProvider.toggleFilter(appSettings.fuzzyMatcher.filterProviders);
        });
        this.settingsService.getChangeObservable().subscribe((appSettings: AppSettings) => {
            this.imageProvider.toggleFilter(appSettings.fuzzyMatcher.filterProviders);
        });
        this.fuzzyService.fuzzyLoader.observeListAndCache().subscribe((listAndCache) => {
            this.imageProvider.setFuzzyList(listAndCache);
        });
    }

    get instance() {
        return this.imageProvider;
    }
}