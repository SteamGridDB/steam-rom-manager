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

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    private previousImage(title: string, currentIndex: number) {
        this.previewService.setImageIndex(title, currentIndex - 1);
    }

    private nextImage(title: string, currentIndex: number) {
        this.previewService.setImageIndex(title, currentIndex + 1);
    }

    private loadImage(title: string, index: number) {
        this.previewService.loadImage(title, index);
    }
}