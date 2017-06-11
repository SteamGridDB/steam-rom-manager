import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Renderer2, ElementRef, RendererStyleFlags2 } from '@angular/core';
import { Subscription } from 'rxjs';
import { PreviewService, SettingsService } from "../services";
import { PreviewData, PreviewDataApp, PreviewVariables, AppSettings } from "../models";

@Component({
    selector: 'preview',
    templateUrl: '../templates/preview.component.html',
    styleUrls: ['../styles/preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewComponent implements OnDestroy {
    private previewData: PreviewData;
    private appSettings: AppSettings;
    private subscriptions: Subscription = new Subscription();
    private previewVariables: PreviewVariables;

    constructor(private previewService: PreviewService, private settingsService: SettingsService, private changeDetectionRef: ChangeDetectorRef, private renderer: Renderer2, private elementRef: ElementRef) {
        this.previewData = this.previewService.getPreviewData();
        this.previewVariables = this.previewService.getPreviewVariables();
        this.subscriptions.add(this.previewService.getPreviewDataChange().subscribe(() => {
            this.previewData = this.previewService.getPreviewData();
            this.changeDetectionRef.detectChanges();
        }));
        this.appSettings = this.settingsService.getSettings();
    }

    generatePreviewData() {
        this.previewService.generatePreviewData();
    }

    preloadImages() {
        this.previewService.preloadImages();
    }

    ngAfterContentInit() {
        if (this.previewVariables.numberOfListItems > 0 && !this.previewVariables.listIsUpdating)
            this.setImageSize(this.appSettings.previewSettings.imageZoomPercentage);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private save() {
        this.previewService.saveData();
    }

    private remove() {
        this.previewService.remove(false);
    }

    private loadImage(app: PreviewDataApp) {
        this.previewService.loadImage(app);
    }

    private refreshImages(app: PreviewDataApp) {
        let propertyTree = app.images.tree;
        this.previewService.downloadImageUrls([propertyTree[propertyTree.length - 1]]);
    }

    private previousImage(appID: PreviewDataApp) {
        this.previewService.setImageIndex(appID, appID.currentImageIndex - 1);
    }

    private nextImage(appID: PreviewDataApp) {
        this.previewService.setImageIndex(appID, appID.currentImageIndex + 1);
    }

    private setImageSize(value: number, save: boolean = false) {
        if (this.elementRef && this.elementRef.nativeElement) {
            if (typeof value === 'string')
                value = parseFloat(value);

            if (value <= 100) {
                if (value < 30)
                    value = 30;
            }
            else
                value = 100;

            this.appSettings.previewSettings.imageZoomPercentage = value;

            if (save){
                this.settingsService.saveAppSettings();
            }

            this.renderer.setStyle(this.elementRef.nativeElement, '--preview-image-size', value / 100, RendererStyleFlags2.DashCase);
        }
    }
}