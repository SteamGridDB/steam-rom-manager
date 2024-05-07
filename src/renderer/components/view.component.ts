import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ElementRef, Renderer2, RendererStyleFlags2 } from '@angular/core';
import { clipboard } from 'electron';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../services';
import {
  ControllerManager,
} from "../../lib";
import { controllerTypes, enableDisplayNames } from '../../lib/controller-manager';
import {artworkTypes, artworkIdDict, artworkSingDict} from '../../lib/artwork-types';
import { VDF_ShortcutsItem, SteamInputEnabled, ControllerTemplate } from "../../models";
import { generateShortAppId } from '../../lib/helpers/steam';
import path from "path";
import _ from "lodash";
import * as url from '../../lib/helpers/url';
import { glob } from 'glob';
import { exec } from "child_process";
import { ViewService } from '../services/view.service';


@Component({
  selector: 'view',
  templateUrl: '../templates/view.component.html',
  styleUrls: ['../styles/view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewComponent {

  private currentShortcut: VDF_ShortcutsItem;
  private currentCats: string;
  private currentLaunch: string;
  private currentControllerEnabled: string;
  private filterValue: string = '';
  private currentArtwork: {[artworkType: string]: string};
  private currentControllers:{[controllerType: string]: any} = {}
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loggerService: LoggerService,
    private viewService: ViewService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private changeDetectionRef: ChangeDetectorRef
  ) {

  }

  get artworkSingDict() {
    return artworkSingDict
  }
  get artworkTypes() {
    return artworkTypes
  }

  ngAfterViewInit() {
    this.refreshGames(false);
  }

  async refreshGames(force?: boolean) {
    if(force) {
      this.loggerService.info('Reading Shortcuts, Categories, and Controllers', {invokeAlert: true, alertTimeout: 3000})
    }
    if(!this.viewService.vdfData || force) {
      this.renderer.setStyle(this.elementRef.nativeElement, '--view-details-width', '0%', RendererStyleFlags2.DashCase);
      this.currentShortcut = null;
      await this.viewService.refreshGames();
    }
    this.changeDetectionRef.detectChanges();
  }

  private sortedShortcuts(shortcuts: VDF_ShortcutsItem[]) {
    return (shortcuts || []).sort((a,b)=>a.appname.localeCompare(b.appname));
  }

  private async setCurrentShortcut(steamDir: string, steamUser: string, shortcut: VDF_ShortcutsItem) {
    this.currentShortcut = shortcut;
    this.renderer.setStyle(this.elementRef.nativeElement, '--view-details-width', '50%', RendererStyleFlags2.DashCase);
    const gridDir = this.viewService.vdfData[steamDir][steamUser].screenshots.gridDir;
    const shortAppId = generateShortAppId(shortcut.exe, shortcut.appname);
    this.currentArtwork = {};
    for(let artworkType of artworkTypes) {
      const files = await glob(`${shortAppId}${artworkIdDict[artworkType]}.*`, { dot: true, cwd: gridDir, absolute: true });
      this.currentArtwork[artworkType] = files.length ? url.encodeFile(files[0]) : require('../../assets/images/no-images.svg');
    }
    this.currentCats = this.currentShortcut.tags.join(" ")
    this.currentLaunch = this.currentShortcut.LaunchOptions ? `${this.currentShortcut.exe} ${this.currentShortcut.LaunchOptions}` : this.currentShortcut.exe;
    this.currentControllers = {};
    for(let controllerType of controllerTypes) {
      const configset = this.viewService.controllerData[steamDir][steamUser].configsets[controllerType]
      if(configset) {
        const appController = configset.controller_config[ControllerManager.transformTitle(this.currentShortcut.appname)];
        if(appController && (appController.template || appController.workshop)) {
          const templates: ControllerTemplate[] = this.viewService.controllerTemplateData[steamDir][controllerType]||[];
          const mappingId = appController.template || appController.workshop;
          const appTemplates = templates.filter(x=>x.mappingId==mappingId);
          if(appTemplates.length && appTemplates[0].title) {
            this.currentControllers[controllerType] = {
              title: appTemplates[0].title,
              templatePath: appController.template ? path.join(ControllerManager.templatesValveDir(steamDir),mappingId) : path.join(ControllerManager.templatesUserDir(steamDir), mappingId)
            }
          }
        }
      }
    }
    let enabled: SteamInputEnabled = (this.viewService.controllerData[steamDir][steamUser].localConfig.UserLocalConfigStore.apps[this.currentShortcut.appid]||{}).UseSteamControllerConfig||"1";
    this.currentControllerEnabled = enableDisplayNames[enabled];
    this.changeDetectionRef.detectChanges()
  }

  private toClipboard(field: string) {
    clipboard.writeText(field);
    this.loggerService.info("Copied to clipboard", { invokeAlert: true, alertTimeout: 3000 });
  }

  private launchTitle() {
    exec(this.currentLaunch, {cwd: this.currentShortcut.StartDir})
  }
}
