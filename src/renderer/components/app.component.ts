import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, NgZone } from '@angular/core';
import { SettingsService, LanguageService, MarkdownService, IpcService} from "../services";
import { MarkdownVariable } from '../../lib';
import { Router } from "@angular/router";
import hljs from 'highlight.js';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItAttrs from 'markdown-it-attrs';
@Component({
  selector: 'app',
  template: `
  <ng-container *ngIf="settingsLoaded && languageLoaded; else stillLoading">
  <titlebar></titlebar>
  <navarea *ngIf="!shouldHideComponent"></navarea>
  <nav-border></nav-border>
  <router-outlet style="display: none;"></router-outlet>
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
  public shouldHideComponent: boolean = false;
  constructor(private settingsService: SettingsService, private languageService: LanguageService, private markdownService: MarkdownService, private router: Router,private ipcService: IpcService, private changeDetectionRef: ChangeDetectorRef, private zone: NgZone) {

    this.settingsService.onLoad((appSettings) => {
      this.settingsLoaded = true;
      document.querySelector('html').className = '';
      document.querySelector('html').classList.add(appSettings.theme)

      // EmuDeck special navigation
      this.router.events.subscribe((val) => {
        if(appSettings.theme==='EmuDeck' &&(['/logger','/user-exceptions','/view','/',].includes(this.router.url))) {
          this.shouldHideComponent = true;
        } else {
          this.shouldHideComponent = false;
        }
      });

      if(appSettings.theme === 'EmuDeck'){
        document.querySelector('html').removeAttribute("style");
        this.router.navigate(['/parsers-list']);
      }else{
        this.router.navigate(['/parsers', -1]);
      }
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
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value;
          } catch (__) { }
        }
        return '';
      }
    }).use(MarkdownVariable).use(markdownItAttrs).use(markdownItAnchor));

    ipcService.on('updater_message', (event, message) => {
      this.updateMessage=message;
    });
    ipcService.on('cli_message', (event, message) => {
      this.settingsService.onLoad((appSettings)=> {
        if(['list', 'enable', 'disable'].includes(message.command)) {
          this.zone.run(()=>{
            this.router.navigate(['/parsers',-1],{
              queryParams: {
                cliMessage: JSON.stringify(message)
              }
            });
          });
        } else if(['add','remove'].includes(message.command)) {
          this.zone.run(()=>{
            this.router.navigate(['/'], {
              queryParams: {
                cliMessage: JSON.stringify(message)
              }
            })
          })
        } else if(['nuke'].includes(message.command)) {
          this.zone.run(()=>{
            this.router.navigate(['/settings'], {
              queryParams: {
                cliMessage: JSON.stringify(message)
              }
            });
          })
        }
      })
    });
  };
}
