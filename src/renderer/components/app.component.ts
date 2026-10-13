import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  NgZone,
} from "@angular/core";
import {
  SettingsService,
  LanguageService,
  MarkdownService,
  IpcService,
} from "../services";
import { MarkdownVariable } from "../../lib/markdown-variable";
import { Router } from "@angular/router";
import hljs from "highlight.js";
import markdownItAnchor from "markdown-it-anchor";
import markdownItAttrs from "markdown-it-attrs";
@Component({
  selector: "app",
  template: `
    <ng-container *ngIf="settingsLoaded && languageLoaded; else stillLoading">
      <ng-container *ngIf="!splash">
        <navarea *ngIf="!shouldHideComponent"></navarea>
        <nav-border></nav-border>
        <router-outlet style="display: none;"></router-outlet>
      </ng-container>
      <ng-container *ngIf="splash">
        <splash [stage]="splashStage" (setup)="splash = !$event"></splash>
      </ng-container>
      <titlebar></titlebar>
      <alert></alert>
      <update-notifier [ipcMessage]="updateMessage"></update-notifier>
    </ng-container>
    <ng-template #stillLoading>
      <div class="appLoading"></div>
    </ng-template>
  `,
  styleUrls: ["../styles/app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  updateMessage: string = "";
  settingsLoaded: boolean = false;
  languageLoaded: boolean = false;
  shouldHideComponent: boolean = false;
  splash: boolean = false;
  splashStage: string = "steamDir";
  constructor(
    private settingsService: SettingsService,
    private languageService: LanguageService,
    private markdownService: MarkdownService,
    private router: Router,
    private ipcService: IpcService,
    private changeDetectionRef: ChangeDetectorRef,
    private zone: NgZone,
  ) {
    this.settingsService.onLoad((appSettings) => {
      this.splash =
        !appSettings.environmentVariables.steamDirectory ||
        !appSettings.environmentVariables.userAccounts.length;
      this.splashStage = appSettings.environmentVariables.steamDirectory
        ? "userAccounts"
        : "steamDir";
      this.settingsLoaded = true;
      document.querySelector("html").className = "";
      document.querySelector("html").classList.add(appSettings.theme);

      // EmuDeck special navigation
      this.router.events.subscribe((val) => {
        if (
          appSettings.theme === "EmuDeck" &&
          ["/logger", "/user-exceptions", "/view", "/"].includes(
            this.router.url,
          )
        ) {
          this.shouldHideComponent = true;
        } else {
          this.shouldHideComponent = false;
        }
      });

      if (appSettings.theme === "EmuDeck") {
        document.querySelector("html").removeAttribute("style");
        this.router.navigate(["/parsers-list"]);
      } else {
        this.router.navigate(["/parsers", "new"]);
      }
      this.changeDetectionRef.detectChanges();
    });
    this.languageService.observeChanges().subscribe((lang) => {
      if (lang !== null) {
        this.languageLoaded = true;
      }
    });
    this.markdownService.createInstance(
      "default",
      require("markdown-it")({
        html: true,
        typographer: true,
        highlight: function (str: string, lang: any) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(lang, str).value;
            } catch (__) {}
          }
          return "";
        },
      })
        .use(MarkdownVariable)
        .use(markdownItAttrs)
        .use(markdownItAnchor),
    );

    ipcService.on("updater_message", (message) => {
      this.updateMessage = message;
    });
  }
}
