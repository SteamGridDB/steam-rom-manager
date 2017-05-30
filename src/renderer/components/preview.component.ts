import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
import { PreviewService } from "../services";
import { PreviewData, ImageContent, PreviewStateVariables } from "../models";

@Component({
    selector: 'preview',
    templateUrl: '../templates/preview.component.html',
    styleUrls: ['../styles/preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewComponent implements OnDestroy {
    private previewData: Observable<PreviewData>;
    private subscriptions: Subscription = new Subscription();
    private stateVariables: PreviewStateVariables;

    constructor(private previewService: PreviewService, private sanitizer: DomSanitizer, private changeDetectionRef: ChangeDetectorRef) {
        this.previewData = this.previewService.getPreviewData();
        this.stateVariables = this.previewService.getStateVariables();
        this.subscriptions.add(this.previewService.getPreviewDataChange().subscribe(() => {
            this.changeDetectionRef.detectChanges();
        }));
    }

    generatePreviewData() {
        this.previewService.generatePreviewData();
    }

    saveData() {
        this.previewService.saveData();
    }

    remove() {
        this.previewService.remove(false);
    }

    removeAll() {
        this.previewService.remove(true);
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private previousImage(appID: string, currentIndex: number) {
        this.previewService.setImageIndex(appID, currentIndex - 1);
    }

    private nextImage(appID: string, currentIndex: number) {
        this.previewService.setImageIndex(appID, currentIndex + 1);
    }

    private loadImage(appID: string, index: number) {
        this.previewService.loadImage(appID, index);
    }

    private refreshImages(imageKey: string) {
        this.previewService.downloadImageUrls([imageKey]);
    }
}