import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Renderer2, ElementRef, RendererStyleFlags2, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { PreviewService, SettingsService, ImageProviderService, IpcService, UserExceptionsService } from "../services";
import { PreviewData, PreviewDataApp, PreviewDataApps, PreviewVariables, AppSettings, ImageContent, SelectItem, UserConfiguration } from "../../models";
import { APP } from '../../variables';
import { FileSelector } from '../../lib';
import { artworkTypes, artworkViewTypes, artworkNamesDict, artworkDimsDict } from '../../lib/artwork-types';
import { superTypes, ArtworkOnlyType, superTypesMap } from '../../lib/parsers/available-parsers';
import { FuzzyTestPipe, IntersectionTestPipe } from '../pipes';
import * as url from '../../lib/helpers/url';
import * as FileSaver from 'file-saver';
import * as appImage from '../../lib/helpers/app-image';
import * as steam from '../../lib/helpers/steam';
import * as _ from 'lodash';
import * as path from 'path';
import { getCurrentImage } from '../../lib/helpers/app-image';

@Component({
  selector: 'preview',
  templateUrl: '../templates/preview.component.html',
  styleUrls: ['../styles/preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnDestroy {
  private previewData: PreviewData;
  private appSettings: AppSettings;
  private subscriptions: Subscription = new Subscription();
  private previewVariables: PreviewVariables;
  private missingArtFilter: boolean = false;
  private showFilters: boolean = false;
  private filterValue: string = '';
  private categoryFilter: string[] = [];
  private allCategories: string[] = [];
  private actualCategoryFilter: string[] = [];
  private parserFilter: string[] = [];
  private allParsers: string[] = [];
  private actualParserFilter: string[] = [];
  private imageTypes: SelectItem[];
  private artworkTypes: string[] = artworkTypes;
  private scrollingEntries: boolean = false;
  private fileSelector: FileSelector = new FileSelector();
  private CLI_MESSAGE: BehaviorSubject<string> = new BehaviorSubject("");

  private detailsApp: {
    app: PreviewDataApp,
    userId: string,
    steamDirectory: string,
    appId: string
  };
  private matchFix: string = '';
  private matchFixIds: string[] = []
  private matchFixDict: {[sgdbId: string]: {name: string, posterUrl: string}};
  private detailsLoading: boolean = true;
  private showDetails: boolean = false;
  private detailsSearchText: string = '';

  private showExcludes: boolean = false;
  private excludedAppIds: {
    [steamDirectory: string]: {
      [userId: string]: {
        [appId: string]: boolean
      }
    }
  } = {};
  private exclusionCount: number = 0;

  constructor(
    private previewService: PreviewService,
    private settingsService: SettingsService,
    private imageProviderService: ImageProviderService,
    private userExceptionsService: UserExceptionsService,
    private changeDetectionRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private activatedRoute: ActivatedRoute,
    private fuzzyTest: FuzzyTestPipe,
    private intersectionTest: IntersectionTestPipe,
    private ipcService: IpcService
  ) {
    this.previewData = this.previewService.getPreviewData();
    this.previewVariables = this.previewService.getPreviewVariables();
    if(this.previewService.getPreviewData()) {
      this.allCategories = this.previewService.getAllCategories();
      this.allParsers = this.previewService.getAllParsers();
      this.previewData = this.previewService.getPreviewData();
    }
    this.appSettings = this.settingsService.getSettings();
    this.imageTypes = artworkViewTypes.map((imageType: string)=>{
      return {value: imageType, displayValue: artworkNamesDict[imageType]}
    });
    this.activatedRoute.queryParamMap.subscribe((paramContainer: any)=> {
      let params = ({...paramContainer} as any).params;
      if(params['cliMessage']) {
        this.CLI_MESSAGE.next(params['cliMessage']);
      }
    });
  }

  generatePreviewData() {
    this.closeDetails();
    this.cancelExcludes();
    this.previewService.generatePreviewData();
  }

  preloadImages() {
    this.previewService.preloadImages();
  }

  setImageBoxSizes() {
    const currentType = this.previewService.getImageType();
    this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', artworkDimsDict[currentType].width, RendererStyleFlags2.DashCase);
    this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', artworkDimsDict[currentType].height, RendererStyleFlags2.DashCase);
  }

  setCategoryFilter(categories: string[]) {
    this.categoryFilter = categories;
    this.actualCategoryFilter = categories.map(c=>c.replace(/&nbsp;/g,' '));
  }

  setParserFilter(parsers: string[]) {
    this.parserFilter = parsers;
    this.actualParserFilter = parsers.map(p=>p.replace(/&nbsp;/g,' '));
  }

  ngAfterContentInit() {
    this.setImageSize(this.appSettings.previewSettings.imageZoomPercentage);
    this.setImageBoxSizes();
  }

  ngAfterViewInit() {
    this.subscriptions.add(this.previewService.getPreviewDataChange().subscribe(_.debounce(() => {
      this.allCategories = this.previewService.getAllCategories();
      this.allParsers = this.previewService.getAllParsers();
      this.previewData = this.previewService.getPreviewData();
      this.changeDetectionRef.detectChanges();
    }, 50)));
    this.subscriptions.add(this.CLI_MESSAGE.asObservable().subscribe((cliMessage: string)=> {
      const parsedCLI = cliMessage ? JSON.parse(cliMessage)||{} : {};
      let hasrun = false;
      if(['add','remove'].includes(parsedCLI.command)) {
        this.previewService.onLoadUserConfigurations((userConfigurations: UserConfiguration[])=> {
          this.ipcService.send('log','Generating app list')
          this.generatePreviewData();
        });
        this.previewService.getPreviewDataChange().subscribe(()=>{
          let previewVariables = this.previewService.getPreviewVariables();
          if(this.previewVariables.listHasGenerated && this.previewVariables.numberOfListItems > 0) {
            this.ipcService.send('inline-log',`Apps: ${this.previewVariables.numberOfListItems}. Remaining images: ${this.previewVariables.numberOfQueriedImages}`);
            if(this.previewVariables.numberOfQueriedImages == 0 && !hasrun) {
              hasrun = true;
              this.ipcService.send('log','')
              if(parsedCLI.command == 'add') {
                this.ipcService.send('log', 'Adding app list to steam');
                this.save().then(()=>{
                  this.ipcService.send('all_done');
                })
              } else {
                this.ipcService.send('log', 'Removing app list from steam');
                this.remove().then(()=>{
                  this.ipcService.send('all_done');
                })
              }
            }
          } else if(this.previewVariables.listHasGenerated){
            this.ipcService.send('log', 'No apps found');
            this.ipcService.send('all_done');
          }
        })
        this.previewService.getBatchProgress().subscribe(({update, batch}: {update: string, batch: number})=>{
          if(batch > -1) {
            this.ipcService.send('inline-log', update);
          }
        })
      }
    }))
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private getImageType() {
    return this.previewService.getImageType();
  }

  private setImageType(imageType: string) {
    this.previewService.setImageType(imageType);
    this.setImageBoxSizes();
    this.changeDetectionRef.detectChanges();
  }

  private getImagePool(poolKey: string, imageType?: string) {
    return this.previewService.getImages(imageType)[poolKey];
  }

  private getAppImages(app: PreviewDataApp, imageType?: string) {

    const actualImageType = this.previewService.getImageType() === 'games' ? imageType : this.previewService.getImageType();
    return app.images[actualImageType];
  }

  private getBackgroundImage(app: PreviewDataApp, imageType?: string) {
    return this.previewService.getCurrentImage(app, imageType);
  }

  private setDetailsBackgroundImage(sgdbId: string) {
    const posterUrl = this.matchFixDict[sgdbId].posterUrl;
    return posterUrl ? posterUrl : require('../../assets/images/no-images.svg');
  }

  private setBackgroundImage(app: PreviewDataApp, image: ImageContent, imageType?: string) {
    if (image == undefined) {
      const actualImageType = this.previewService.getImageType() === 'games' ? imageType : this.previewService.getImageType();
      let imagepool: string = app.images[actualImageType].imagePool;
      if (this.previewService.getImages(imageType)[imagepool].retrieving)
        return require('../../assets/images/retrieving-images.svg');
      else
        return require('../../assets/images/no-images.svg');
    }
    else {
      if (image.loadStatus === 'notStarted') {
        if(this.previewService.getImageType()==='games') {
          this.loadImage(app, imageType)
        } else {
          this.loadImage(app);
        }
        return require('../../assets/images/downloading-image.svg');
      }
      else if (image.loadStatus === 'downloading') {
        return require('../../assets/images/downloading-image.svg');
      }
      else if (image.loadStatus === 'done')
        return image.imageUrl;
      else
        return require('../../assets/images/failed-image-download.svg');
    }
  }

  private loadImage(app: PreviewDataApp, imageType?: string) {
    this.previewService.loadImage(app, imageType);
  }

  private areImagesAvailable(app: PreviewDataApp, imageType?: string) {
    return this.previewService.areImagesAvailable(app, imageType);
  }

  private currentImageIndex(app: PreviewDataApp, imageType?: string) {
    if(this.previewService.getImageType() !== 'games') {
      imageType=this.previewService.getImageType()
    }
    return app.images[imageType].imageIndex + 1;
  }

  private maxImageIndex(app: PreviewDataApp, imageType?: string) {
    return this.previewService.getTotalLengthOfImages(app, imageType);
  }

  private addLocalImages(app: PreviewDataApp, imageType?: string) {
    this.fileSelector.multiple = true;
    this.fileSelector.accept = '.png, .jpeg, .jpg, .tga, .webp';
    if(this.previewService.getImageType() != 'games') {
      imageType=this.previewService.getImageType()
    }
    this.fileSelector.onChange = (target) => {
      if (target.files) {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        for (let i = 0; i < target.files.length; i++) {
          if (extRegex.test(path.extname(target.files[i].path))) {
            let imageUrl = url.encodeFile(target.files[i].path);
            this.previewService.addUniqueImage(app.images[imageType].imagePool, {
              imageProvider: 'ManuallyAdded',
              imageUrl: imageUrl,
              loadStatus: 'done'
            }, imageType);
            this.previewService.setImageIndex(app, this.previewService.getTotalLengthOfImages(app, imageType, true) -1, imageType, true);
          }
        }
      }
    };
    this.fileSelector.trigger();
  }

  private get lang() {
    return APP.lang.preview.component;
  }

  private stopImageRetrieving() {
    this.imageProviderService.instance.stopUrlDownload();
  }

  private save() {
    return this.previewService.saveData({removeAll: false, batchWrite: true});
  }

  private remove() {
    for (const directory in this.previewData) {
      for (const userId in this.previewData[directory]) {
        for (const appId in this.previewData[directory][userId].apps) {
          this.previewData[directory][userId].apps[appId].status = 'remove';
        }
      }
    }
    return this.previewService.saveData({removeAll: false, batchWrite: false}).then((noError: boolean | void) => {
      if (noError)
        this.previewService.clearPreviewData();
    });
  }

  private toggleFilters() {
    if(this.showFilters) {
      this.showFilters = false;
      this.renderer.setStyle(this.elementRef.nativeElement,'--filters-width','0%',RendererStyleFlags2.DashCase);
    } else {
      this.showFilters = true;
      this.renderer.setStyle(this.elementRef.nativeElement, '--filters-width', '300px', RendererStyleFlags2.DashCase);
    }
    this.changeDetectionRef.detectChanges();
  }

  private setArtFilter(artFilter: boolean) {
    this.missingArtFilter = artFilter;
    this.changeDetectionRef.detectChanges();
  }

  private searchMatches(searchTitle: string) {
    this.previewService.getMatchFixes(searchTitle).then((games: any[])=>{
      this.matchFixDict = Object.fromEntries(games.map((x: any)=>[x.id.toString(), {name: x.name, posterUrl: x.posterUrl}]));
      this.matchFixIds = games.map((x:any)=>x.id.toString());
      this.detailsLoading = false;
      this.changeDetectionRef.detectChanges();
    })
  }
  private searchForDetails() {
    if(this.detailsSearchText) {
      this.searchMatches(this.detailsSearchText);
    }
  }
  private changeAppDetails(app: PreviewDataApp, steamDirectory: string, userId: string, appId: string) {
    this.detailsLoading = true;
    this.showDetails= true;
    this.matchFix = '';
    this.renderer.setStyle(this.elementRef.nativeElement, '--details-width', '50%', RendererStyleFlags2.DashCase);
    this.changeDetectionRef.detectChanges()
    this.detailsApp = {
      appId: appId,
      app: app,
      steamDirectory: steamDirectory,
      userId: userId
    };
    this.searchMatches(this.detailsApp.app.extractedTitle);
  }

  private fixMatch(sgdbId: string) {
    this.matchFix = sgdbId;
  }
  private closeDetails() {
    this.detailsSearchText = '';
    this.matchFix = '';
    this.detailsApp = undefined;
    this.showDetails = false;
    this.renderer.setStyle(this.elementRef.nativeElement, '--details-width','0%', RendererStyleFlags2.DashCase);
    this.detailsLoading = false;
  }

  private saveDetails() {
    if(this.detailsApp && this.matchFix) {
      const {steamDirectory, userId, appId, app} = this.detailsApp;
      this.previewData[steamDirectory][userId].apps[appId].title = this.matchFixDict[this.matchFix].name;
      if(superTypesMap[app.parserType] !== 'ArtworkOnly') {
        const changedId = steam.generateAppId(app.executableLocation, this.matchFixDict[this.matchFix].name);
        this.previewData[steamDirectory][userId].apps[appId].changedId = changedId;
      }
      const newPool = `\$\{gameid:${this.matchFix}\}`
      for(const artworkType of artworkTypes) {
        const oldPool = this.previewData[steamDirectory][userId].apps[appId].images[artworkType].imagePool;
        this.previewData[steamDirectory][userId].apps[appId].images[artworkType].imagePool = newPool;
        this.previewData[steamDirectory][userId].apps[appId].images[artworkType].steam = undefined;
        this.previewService.updateAppImages(newPool, oldPool, artworkType)
      }
      let exceptionId;
      if(superTypes[ArtworkOnlyType].includes(app.parserType)) {
        exceptionId = app.executableLocation.replace(/\"/g,"");
      } else {
        exceptionId = steam.generateShortAppId(app.executableLocation, app.extractedTitle)
      }
      const exceptionKey = `${app.extractedTitle} \$\{id:${exceptionId}\}`;
      this.userExceptionsService.addException(exceptionKey, {
        newTitle: this.matchFixDict[this.matchFix].name,
        searchTitle: newPool,
        commandLineArguments: '',
        exclude: false,
        excludeArtwork: false
      })
      if(this.previewService.getImageType()=='games') { 
        for(const artworkType of artworkTypes) {
          this.refreshImages(this.previewData[steamDirectory][userId].apps[appId], artworkType)
        }
      } else {
        this.refreshImages(this.previewData[steamDirectory][userId].apps[appId]);
      }
      this.closeDetails();
    }
  }

  private excludeAppId(steamDirectory: string, userId: string, appId: string, override?: boolean) {
    if(this.showExcludes) {
      if(!this.excludedAppIds[steamDirectory]) {
        this.excludedAppIds[steamDirectory] = {};
      }
      if(!this.excludedAppIds[steamDirectory][userId]) {
        this.excludedAppIds[steamDirectory][userId] = {};
      }
      if(override === undefined) {
        if(this.excludedAppIds[steamDirectory][userId][appId]) {
          this.excludedAppIds[steamDirectory][userId][appId] = false;
          this.exclusionCount -= 1;
        } else {
          this.excludedAppIds[steamDirectory][userId][appId] = true;
          this.exclusionCount += 1;
        }
      } else {
        if(!override != !this.excludedAppIds[steamDirectory][userId][appId]) {
          this.exclusionCount += override ? 1 : -1;
        }
        this.excludedAppIds[steamDirectory][userId][appId] = override;
      }
    }
  }

  private isAppVisible(app: PreviewDataApp) {
    const searchFilter = this.fuzzyTest.transform(app.title, this.filterValue);
    const categoryFilter = this.intersectionTest.transform(app.steamCategories, this.actualCategoryFilter);
    const configFilter = this.intersectionTest.transform([app.configurationTitle], this.actualParserFilter);
    let missingArtFilter;
    const imageType = this.previewService.getImageType();
    if(!this.missingArtFilter) {
      missingArtFilter = true;
    } else {
      if(imageType=='games') {
        missingArtFilter = artworkTypes.map(t=> !this.previewService.getCurrentImage(app,t)).reduce((x,y)=>x||y);
      } else {
        missingArtFilter = !this.previewService.getCurrentImage(app)
      }
    }
    const excludesArtOnlyFilter = !this.showExcludes || superTypesMap[app.parserType]!=='ArtworkOnly'
    return searchFilter && categoryFilter && configFilter && missingArtFilter && excludesArtOnlyFilter;
  }

  private excludeVisible() {
    for(let steamDirectory in this.previewData) {
      for(let userId in this.previewData[steamDirectory]) {
        for(let appId in this.previewData[steamDirectory][userId].apps) {
          if(this.isAppVisible(this.previewData[steamDirectory][userId].apps[appId])) {
            this.excludeAppId(steamDirectory, userId, appId, true);
          }
        }
      }
    }
  }

  private includeVisible() {
    for(let steamDirectory in this.previewData) {
      for(let userId in this.previewData[steamDirectory]) {
        for(let appId in this.previewData[steamDirectory][userId].apps) {
          if(this.isAppVisible(this.previewData[steamDirectory][userId].apps[appId])) {
            this.excludeAppId(steamDirectory, userId, appId, false);
          }
        }
      }
    }
  }

  private showExclusions() {
    this.showExcludes = true;
  }

  private cancelExcludes() {
    this.showExcludes = false;
    this.excludedAppIds = {};
    this.exclusionCount = 0;
  }

  private saveExcludes() {
    let exceptionKeys: string[] = [];
    for(const steamDirectory in this.previewData) {
      if(this.excludedAppIds[steamDirectory]) {
        for(const userId in this.previewData[steamDirectory]) {
          if(this.excludedAppIds[steamDirectory][userId]) {
            let newKeys = Object.keys(this.excludedAppIds[steamDirectory][userId]).filter((appId: string)=> {
              return !!this.excludedAppIds[steamDirectory][userId][appId]
            }).map((appId: string) =>{
              const app = this.previewData[steamDirectory][userId].apps[appId];
              const exceptionId = steam.generateShortAppId(app.executableLocation, app.extractedTitle)
              return `${app.extractedTitle} \$\{id:${exceptionId}\}`
            });
            exceptionKeys = exceptionKeys.concat(newKeys)
            this.previewData[steamDirectory][userId].apps = _.pickBy(this.previewData[steamDirectory][userId].apps, (value: PreviewDataApp, key: string) => {
              return !this.excludedAppIds[steamDirectory][userId][key]
            })
          }
        }
      }
    }
    for(const exceptionKey of exceptionKeys) {
      this.userExceptionsService.addException(exceptionKey, {
        newTitle: '',
        searchTitle: '',
        commandLineArguments: '',
        exclude: true,
        excludeArtwork: false
      })
    }
    this.cancelExcludes();
  }

  private refreshImages(app: PreviewDataApp, imageType?: string) {
    if(this.previewService.getImageType()=='games') {
      this.previewService.downloadImageUrls(imageType,[app.images[imageType].imagePool], app.imageProviders);
    } else {
      for(const artworkType of artworkTypes) {
        this.previewService.downloadImageUrls(artworkType,[app.images[artworkType].imagePool], app.imageProviders);
      }
    }
  }

  private saveImage(image: ImageContent, title: string) {
    FileSaver.saveAs(image.imageUrl, title.replace(/[/\\?%*:|"<>]/g, '-'))
  }

  private previousImage(app: PreviewDataApp, imageType?: string) {
    if(this.previewService.getImageType() !== 'games'){
      imageType = this.previewService.getImageType();
    }
    this.previewService.setImageIndex(app, app.images[imageType].imageIndex - 1, imageType);
  }

  private nextImage(app: PreviewDataApp, imageType?: string) {
    if(this.previewService.getImageType()!='games'){
      imageType = this.previewService.getImageType();
    }
    this.previewService.setImageIndex(app, app.images[imageType].imageIndex + 1, imageType);
  }

  private setImageSize(value: number, save: boolean = false) {
    if (this.elementRef && this.elementRef.nativeElement) {
      if (typeof value === 'string') {
        value = parseFloat(value);
      }
      value = Math.min(Math.max(value, 30), 100);
      this.appSettings.previewSettings.imageZoomPercentage = value;
      if (save) {
        this.settingsService.saveAppSettings();
      }
      this.renderer.setStyle(this.elementRef.nativeElement, '--preview-image-size', value / 100, RendererStyleFlags2.DashCase);
    }
  }

  private onScrollEnd = _.debounce(() => {
    this.scrollingEntries = false;
    this.changeDetectionRef.detectChanges();
  }, 150);

  private onScroll() {
    this.scrollingEntries = true;
    this.onScrollEnd();
  }

  private sortedAppIds(apps: PreviewDataApps) {
    return Object.keys(apps).sort((a,b)=>apps[a].title.localeCompare(apps[b].title))
  }

  private async exportSelection() {
    await this.previewService.exportSelection();
  }

  private async importSelection() {
    await this.previewService.importSelection();
  }
}
