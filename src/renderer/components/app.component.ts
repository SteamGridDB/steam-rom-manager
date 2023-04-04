import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SettingsService, LanguageService, MarkdownService, IpcService} from "../services";
import { MarkdownVariable } from '../../lib';
import { Router } from "@angular/router";
import * as highlight from 'highlight.js';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
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
            <update-notifier [ipcMessage]=updateMessage></update-notifier>
        </ng-container>
        <ng-template #stillLoading>
            <div class="appLoading"></div>
        </ng-template>
    `,
  styleUrls: ['../styles/app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent {
  private updateMessage: string = '';
  private cliMessage: string = '';
  private settingsLoaded: boolean = false;
  private languageLoaded: boolean = false;
  constructor(private settingsService: SettingsService, private languageService: LanguageService, private markdownService: MarkdownService, private router: Router,private ipcService: IpcService, private changeDetectionRef: ChangeDetectorRef) {
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
    this.markdownService.createInstance('default', require('markdown-it')({
      html: true,
      typographer: true,
      highlight: function (str: string , lang: any) {
        if (lang && highlight.getLanguage(lang)) {
          try {
            return highlight.highlight(lang, str).value;
          } catch (__) { }
        }
        return '';
      }
    }).use(MarkdownVariable).use(markdownItAttrs).use(markdownItAnchor));

    ipcService.on('updater_message', (event, message) => {
      this.updateMessage=message;
    });
    ipcService.on('cli_message', (event, message) => {
      if(message.command === 'list') {
        this.router.navigate(['/parsers',-1],{queryParams: {cliMessage: JSON.stringify(message)}})

      } else if(message["command"] === 'test_parser') {

      } else if(message.command === 'run_parsers') {

      }
    });
  };
}
