import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ElementRef, Renderer2, RendererStyleFlags2 } from '@angular/core';
import { clipboard } from 'electron';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { PreviewService, LoggerService, ParsersService } from '../services';
import { Subscription } from "rxjs";
import { APP } from '../../variables';
import {
  VDF_Manager,
  VDF_Error,
  CategoryManager,
  ControllerManager,
  Acceptable_Error
} from "../../lib";
import {artworkTypes, artworkIdDict, artworkDimsDict, artworkSingDict} from '../../lib/artwork-types';
import { UserData, VDF_ListItem, VDF_ListData, VDF_ShortcutsItem } from "../../models";
import { generateShortAppId } from '../../lib/helpers/steam';
import path from "path";
import fs from "fs-extra";
import _ from "lodash";
import * as url from '../../lib/helpers/url';
import { glob } from 'glob';
import { exec } from "child_process";


@Component({
  selector: 'view',
  templateUrl: '../templates/view.component.html',
  styleUrls: ['../styles/view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private vdfData: VDF_ListData;
  private controllerData: UserData;
  private categoryData: UserData;
  private currentShortcut: VDF_ShortcutsItem;
  private currentCats: string;
  private currentLaunch: string;
  private filterValue: string = '';
  private currentArtwork: {[artworkType: string]: string} = {};
  private artworkSingDict: {[artworkType: string]: string} = artworkSingDict;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loggerService: LoggerService,
    private parsersService: ParsersService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private changeDetectionRef: ChangeDetectorRef
  ) {

  }
  private get lang() {
    // return APP.lang.view.component;
    return {};
  }

  async refreshGames() {
    this.currentShortcut = null;
    this.renderer.setStyle(this.elementRef.nativeElement, '--view-details-width', '0%', RendererStyleFlags2.DashCase);
    let knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    const vdfManager = new VDF_Manager();
    await vdfManager.prepare(knownSteamDirectories);
    await vdfManager.read();
    const vdfData = vdfManager.vdfData;
    const categoryManager = new CategoryManager();
    let categoryData: {[steamDirectory:string]: {[userId:string]: any}} = {};
    const controllerManager = new ControllerManager();
    let controllerData: {[steamDirectory: string]: {[userId: string]: any}} = {};
    for(const steamDirectory in vdfData) {
      categoryData[steamDirectory] = {};
      controllerData[steamDirectory] = {};
      for(const userId in vdfData[steamDirectory]) {
        try {
          categoryData[steamDirectory][userId] = await categoryManager.readCategories(steamDirectory, userId);
        } catch (e) {}
        const configsetDir = ControllerManager.configsetDir(steamDirectory, userId);
        controllerData[steamDirectory][userId] = controllerManager.readControllers(configsetDir);
      }
    }
    this.vdfData = vdfData;
    this.controllerData = controllerData;
    this.categoryData = categoryData;
    //console.log("controllerData", controllerData)
    //console.log("vdfData",this.vdfData)
    //console.log("categoryData",this.categoryData)
    this.changeDetectionRef.detectChanges();
  }

  private sortedShortcuts(shortcuts: VDF_ShortcutsItem[]) {
    return shortcuts.sort((a,b)=>a.appname.localeCompare(b.appname));
  }

  private async setCurrentShortcut(steamDir: string, steamUser: string, shortcut: VDF_ShortcutsItem) {
    this.currentShortcut = shortcut;
    this.renderer.setStyle(this.elementRef.nativeElement, '--view-details-width', '50%', RendererStyleFlags2.DashCase);
    const gridDir = this.vdfData[steamDir][steamUser].screenshots.gridDir;
    const shortAppId = generateShortAppId(shortcut.exe, shortcut.appname);
    for(let artworkType of artworkTypes) {
      const files = await glob(`${shortAppId}${artworkIdDict[artworkType]}.*`, { dot: true, cwd: gridDir, absolute: true });
      this.currentArtwork[artworkType] = files.length ? url.encodeFile(files[0]) : require('../../assets/images/no-images.svg');
    }
    this.currentArtwork = _.clone(this.currentArtwork)
    this.currentCats = this.currentShortcut.tags.join(" ")
    this.currentLaunch = this.currentShortcut.LaunchOptions ? `${this.currentShortcut.exe} ${this.currentShortcut.LaunchOptions}` : this.currentShortcut.exe;
    this.changeDetectionRef.detectChanges()
  }

  private toClipboard(field: string) {
    clipboard.writeText(field);
    this.loggerService.info("Copied to clipboard", { invokeAlert: true, alertTimeout: 3000 });
  }

  private launchTitle() {
    exec(this.currentLaunch, {cwd: this.currentShortcut.StartDir})
  }

  ngAfterViewInit() {
    this.refreshGames();
  }

  ngOnDestroy () {
    this.subscriptions.unsubscribe()
  }
}
