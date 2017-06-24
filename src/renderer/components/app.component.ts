import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService } from "../services";
import { Router } from "@angular/router";
import { Subscription } from 'rxjs';

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
export class AppComponent implements OnDestroy {
    private settingsLoaded: boolean = false;
    private subscriptions: Subscription = new Subscription();

    constructor(private settingsService: SettingsService, private router: Router, private changeDetectionRef: ChangeDetectorRef) {
        this.subscriptions.add(this.settingsService.getLoadStatusObservable().subscribe((loaded) => {
            if (loaded) {
                this.settingsLoaded = loaded;
                this.router.initialNavigation();
                this.changeDetectionRef.detectChanges();
                this.subscriptions.unsubscribe();
            }
        }));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }
}