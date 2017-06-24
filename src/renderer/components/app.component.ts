import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService } from "../services";
import { Router } from "@angular/router";

@Component({
    selector: 'app',
    template: `
        <ng-container *ngIf="settingsLoaded; else stillLoading">
            <titlebar></titlebar>
            <section>
                <nav></nav>
                <router-outlet></router-outlet>
            </section>
            <theme></theme>
            <alert></alert>
        </ng-container>
        <ng-template #stillLoading>
            <div class="appLoading loadingSettings"></div>
        </ng-template>
    `,
    styleUrls: ['../styles/app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    private settingsLoaded: boolean = false;

    constructor(private settingsService: SettingsService, private router: Router, private changeDetectionRef: ChangeDetectorRef) {
        this.settingsService.onLoad(() => {
            this.settingsLoaded = true;
            this.router.initialNavigation();
            this.changeDetectionRef.detectChanges();
        });
    }
}