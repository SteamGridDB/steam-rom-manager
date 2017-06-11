import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService, PreviewService } from "../services";
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

    constructor(private settingsService: SettingsService, private previewService: PreviewService, private changeDetectionRef: ChangeDetectorRef) { 
        this.subscriptions.add(this.settingsService.getChangeObservable().subscribe(() => {
            this.changeDetectionRef.detectChanges();
        }));
        this.settings = this.settingsService.getSettings();
    }
    
    onSettingsChange(detectChanges: boolean = true){
        if (detectChanges)
            this.settingsService.settingsChanged();

        this.settingsService.saveAppSettings();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private removeApps(){
        if (this.settings.knownSteamDirectories.length > 0)
            this.previewService.remove(true);
    }

    private preload(value: boolean){
        if (this.settings.previewSettings.preload !== value && value)
            this.previewService.preloadImages();

        this.settings.previewSettings.preload = value;
    }
}