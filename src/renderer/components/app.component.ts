import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService, LanguageService, MarkdownService } from "../services";
import { MarkdownVariable } from '../../lib';
import { Router } from "@angular/router";
import * as highlight from 'highlight.js';
import * as markdownIt from 'markdown-it';

@Component({
    selector: 'app',
    template: `
        <ng-container *ngIf="settingsLoaded && languageLoaded; else stillLoading">
            <titlebar></titlebar>
            <nav></nav>
            <nav-border></nav-border>
            <router-outlet style="display: none;"></router-outlet>
            <theme></theme>
            <alert></alert>
        </ng-container>
        <ng-template #stillLoading>
            <div class="appLoading"></div>
        </ng-template>
    `,
    styleUrls: ['../styles/app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    private settingsLoaded: boolean = false;
    private languageLoaded: boolean = false;

    constructor(private settingsService: SettingsService, private languageService: LanguageService, private markdownService: MarkdownService, private router: Router, private changeDetectionRef: ChangeDetectorRef) {
        this.settingsService.onLoad((appSettings) => {
            this.settingsLoaded = true;
            this.router.navigate(['/parsers', -1]);
            this.changeDetectionRef.detectChanges();
        });
        this.languageService.observeChanges().subscribe((lang) => {
            if (lang !== null) {
                this.languageLoaded = true;
            }
        });
        this.markdownService.createInstance('default', new markdownIt({
            typographer: true,
            highlight: function (str, lang) {
                if (lang && highlight.getLanguage(lang)) {
                    try {
                        return highlight.highlight(lang, str).value;
                    } catch (__) { }
                }
                return '';
            }
        }).use(MarkdownVariable).use(require('markdown-it-attrs')).use(require('markdown-it-anchor')));
    };
}