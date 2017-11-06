import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ParsersService, LanguageService } from '../services';
import { UserConfiguration } from '../../models';
import { Subscription } from 'rxjs';
import { APP } from '../../variables';

@Component({
    selector: 'nav',
    templateUrl: '../templates/nav.component.html',
    styleUrls: [
        '../styles/nav.component.scss'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent {
    private userConfigurations: { saved: UserConfiguration, current: UserConfiguration }[];
    private dummy = true;
    private subscriptions: Subscription = new Subscription();

    constructor(private parsersService: ParsersService, private languageService: LanguageService, private changeRef: ChangeDetectorRef) {}

    ngOnInit() {
        this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((userConfigurations) => {
            this.userConfigurations = userConfigurations;
            this.refreshActiveRoute();
            this.changeRef.detectChanges();
        }));
        this.languageService.observeChanges().subscribe((lang) => {
            this.changeRef.detectChanges();
        });
    }

    private refreshActiveRoute(){
        this.dummy = !this.dummy;
    }

    private get lang(){
        return APP.lang.nav.component;
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }
}