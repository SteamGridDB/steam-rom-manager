import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService, PreviewService, LanguageService, ImageProviderService } from "../services";
import { gApp } from "../app.global";
import { AppSettings } from "../models";
import { Subscription } from 'rxjs';

@Component({
    selector: 'settings',
    templateUrl: '../templates/settings.component.html',
    styleUrls: ['../styles/settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnDestroy {
    private subscriptions: Subscription = new Subscription();
    private settings: AppSettings;
    private availableProviders: string[];
    private availableLanguages: string[];

    constructor(private settingsService: SettingsService, private languageService: LanguageService, private imageProviderService: ImageProviderService, private previewService: PreviewService, private changeDetectionRef: ChangeDetectorRef) { }

    ngOnInit() {
        this.subscriptions.add(this.settingsService.getChangeObservable().subscribe(() => {
            this.changeDetectionRef.detectChanges();
        }));
        this.settings = this.settingsService.getSettings();
        this.availableProviders = this.imageProviderService.instance.getAvailableProviders();
        this.availableLanguages = this.languageService.getAvailableLanguages();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private get lang() {
        return gApp.lang.settings.component;
    }

    private onSettingsChange(detectChanges: boolean = true) {
        if (detectChanges)
            this.settingsService.settingsChanged();

        this.settingsService.saveAppSettings();
    }

    private removeApps() {
        if (this.settings.knownSteamDirectories.length > 0)
            this.previewService.remove(true);
    }

    private preload(value: boolean) {
        if (this.settings.previewSettings.preload !== value && value)
            this.previewService.preloadImages();

        this.settings.previewSettings.preload = value;
    }

    private loadLanguage(){
        this.languageService.loadLanguage(this.settings.language);
    }
}