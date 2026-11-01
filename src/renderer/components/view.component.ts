import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ElementRef,
  Renderer2,
  RendererStyleFlags2,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LoggerService, SettingsService } from "../services";
import { enableDisplayNames } from "../../lib/controller-types";
import { artworkTypes, artworkSingDict } from "../../lib/artwork-types";
import { VDF_ShortcutsItem, AppSettings } from "../../models";
import { ViewService } from "../services/view.service";
import { APP } from "../../variables";

@Component({
  selector: "view",
  templateUrl: "../templates/view.component.html",
  styleUrls: ["../styles/view.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent {
  appSettings: AppSettings;
  currentShortcut: VDF_ShortcutsItem;
  currentCats: string;
  currentLaunch: string;
  private current: { steamDir: string; steamUser: string };
  currentControllerEnabled: string;
  filterValue: string = "";
  currentArtwork: { [artworkType: string]: string };
  currentControllers: { [controllerType: string]: any } = {};
  refreshingGames: boolean = false;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loggerService: LoggerService,
    private settingsService: SettingsService,
    public viewService: ViewService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private changeDetectionRef: ChangeDetectorRef,
  ) {
    this.appSettings = this.settingsService.getSettings();
  }

  get lang() {
    return APP.lang.view.component;
  }

  get artworkSingDict() {
    return artworkSingDict;
  }
  get artworkTypes() {
    return artworkTypes;
  }

  ngAfterViewInit() {
    this.refreshGames(false);
  }

  async refreshGames(force?: boolean) {
    if (force) {
      this.loggerService.info(this.lang.readingShortcuts, {
        invokeAlert: true,
        alertTimeout: 3000,
      });
    }
    if ((!this.viewService.shortcuts || force) && !this.refreshingGames) {
      this.refreshingGames = true;
      this.renderer.setStyle(
        this.elementRef.nativeElement,
        "--view-details-width",
        "0%",
        RendererStyleFlags2.DashCase,
      );
      this.currentShortcut = null;
      try {
        await this.viewService.refreshGames();
      } catch (e) {
        this.loggerService.error(e);
      }
      this.refreshingGames = false;
    }
    this.changeDetectionRef.detectChanges();
  }

  sortedShortcuts(shortcuts: VDF_ShortcutsItem[]) {
    return (shortcuts || []).sort((a, b) =>
      (a.appname || "").localeCompare(b.appname || ""),
    );
  }

  async setCurrentShortcut(
    steamDir: string,
    steamUser: string,
    shortcut: VDF_ShortcutsItem,
  ) {
    this.currentShortcut = shortcut;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--view-details-width",
      "50%",
      RendererStyleFlags2.DashCase,
    );
    this.current = { steamDir, steamUser };
    this.currentCats = shortcut.tags.join(" ");
    this.currentLaunch = shortcut.LaunchOptions
      ? `${shortcut.exe} ${shortcut.LaunchOptions}`
      : shortcut.exe;
    this.currentArtwork = {};
    this.currentControllers = {};
    this.currentControllerEnabled = undefined;
    try {
      const details = await this.viewService.details(
        steamDir,
        steamUser,
        shortcut.appid,
      );
      if (this.currentShortcut !== shortcut) {
        return; // another shortcut was picked meanwhile
      }
      for (const artworkType of artworkTypes) {
        this.currentArtwork[artworkType] =
          details.artwork[artworkType] ??
          require("../../assets/images/no-images.svg");
      }
      this.currentControllers = details.controllers;
      this.currentControllerEnabled =
        enableDisplayNames[details.steamInputEnabled];
    } catch (e) {
      this.loggerService.error(e);
    }
    this.changeDetectionRef.detectChanges();
  }

  toClipboard(field: string) {
    navigator.clipboard.writeText(field);
    this.loggerService.info(this.lang.copiedToClipboard, {
      invokeAlert: true,
      alertTimeout: 3000,
    });
  }

  launchTitle() {
    this.viewService
      .launch(
        this.current.steamDir,
        this.current.steamUser,
        this.currentShortcut.appid,
      )
      .catch((e) => this.loggerService.error(e));
  }
}
