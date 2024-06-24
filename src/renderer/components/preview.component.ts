import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Renderer2, ElementRef, RendererStyleFlags2, HostListener, ɵɵsetComponentScope } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { PreviewService, SettingsService, ImageProviderService, IpcService, UserExceptionsService } from "../services";
import { PreviewData, PreviewDataApp, PreviewDataApps, PreviewVariables, AppSettings, ImageContent, SelectItem, UserConfiguration, ArtworkViewType, ArtworkType, isArtworkType, ImageProviderType, UserExceptionData, SteamList } from "../../models";
import { APP } from '../../variables';
import { FileSelector } from '../../lib';
import { artworkTypes, artworkViewTypes, artworkViewNames, artworkDimsDict } from '../../lib/artwork-types';
import { superTypes, ArtworkOnlyType, superTypesMap } from '../../lib/parsers/available-parsers';
import { FuzzyTestPipe, IntersectionTestPipe } from '../pipes';
import * as url from '../../lib/helpers/url';
import * as FileSaver from 'file-saver';
import * as steam from '../../lib/helpers/steam';
import * as _ from 'lodash';
import * as path from 'path';
import { allProviders, imageProviderNames, providerCategories, sgdbIdRegex } from '../../lib/image-providers/available-providers';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'preview',
  templateUrl: '../templates/preview.component.html',
  styleUrls: ['../styles/preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnDestroy {
  previewData: PreviewData;
  appSettings: AppSettings;
  subscriptions: Subscription = new Subscription();
  previewVariables: PreviewVariables;
  missingArtFilter: boolean = false;
  exceptionFilter: boolean = false;
  showFilters: boolean = false;
  filterValue: string = '';
  categoryFilter: string[] = [];
  allCategories: string[] = [];
  actualCategoryFilter: string[] = [];
  parserFilter: string[] = [];
  allParsers: string[] = [];
  actualParserFilter: string[] = [];
  artworkSelectTypes: SelectItem[];
  sortBySelectTypes: SelectItem[];
  scrollingEntries: boolean = false;
  fileSelector: FileSelector = new FileSelector();
  CLI_MESSAGE: BehaviorSubject<string> = new BehaviorSubject("");
  currentApp: {
    app: PreviewDataApp,
    userId: string,
    steamDirectory: string,
    appId: string
  }
  listImagesArtworkType: ArtworkType = 'tall';
  listImagesRanges: {[k: string]: {start: number, end: number}};
  listSortBy: string = 'extractedTitle';
  showListImages: boolean = false;
  detailsApp: {
    app: PreviewDataApp,
    userId: string,
    steamDirectory: string,
    appId: string
  };
  matchFix: string = '';
  matchFixIds: string[] = []
  matchFixDict: {[sgdbId: string]: {name: string, posterUrl: string}};
  detailsLoading: boolean = true;
  showDetails: boolean = false;
  detailsSearchText: string = '';
  detailsException: UserExceptionData;
  detailsOriginalExcludeArt: boolean = false;
  hideDetailsPerApp: boolean = false;

  showExcludes: boolean = false;
  excludedAppIds: SteamList<{[appId: string]: boolean}> = {};
  excludePutBacks: {[exceptionKey: string]: boolean} = {};
  exclusionCount: number = 0;

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
    private ipcService: IpcService,
    private sanitizer: DomSanitizer
  ) {
    this.previewData = this.previewService.getPreviewData();
    this.previewVariables = this.previewService.getPreviewVariables();
    if(this.previewService.getPreviewData()) {
      this.allCategories = this.previewService.getAllCategories();
      this.allParsers = this.previewService.getAllParsers();
      this.previewData = this.previewService.getPreviewData();
    }
    this.appSettings = this.settingsService.getSettings();
    this.artworkSelectTypes = artworkViewTypes.map((artworkViewType: ArtworkViewType) => {
      return {value: artworkViewType, displayValue: artworkViewNames[artworkViewType]}
    });
    this.sortBySelectTypes = [
      {value: 'extractedTitle', displayValue: 'Extracted Title'},
      {value: 'title', displayValue: 'Final Title'},
      {value: 'configurationTitle', displayValue: 'Parser'}
    ];
    this.activatedRoute.queryParamMap.subscribe((paramContainer: any)=> {
      let params = ({...paramContainer} as any).params;
      if(params['cliMessage']) {
        this.CLI_MESSAGE.next(params['cliMessage']);
      }
    });
  }

  get lang() {
    return APP.lang.preview.component;
  }

  get inViewDict() {
    return this.previewService.inViewDict;
  }

  get artworkTypes() {
    return artworkTypes;
  }

  get artworkViewNames() {
    return artworkViewNames;
  }
  
  get providerCategories() {
    return providerCategories;
  }
  get allProviders() {
    return allProviders;
  }

  get imageProviderNames() {
    return imageProviderNames
  }


  isArtworkType(artworkViewType: ArtworkViewType) {
    return isArtworkType(artworkViewType)
  }

  clearInView() {
    this.previewService.inViewDict = {};
  }

  closeAll() {
    this.closeFilters()
    this.closeRight();
  }

  closeRight() {
    this.closeDetails();
    this.closeListImages();
    this.cancelExcludes();
  }

  generatePreviewData() {
    this.clearInView();
    this.closeRight();
    this.previewService.generatePreviewData();
  }

  setImageBoxSizes() {
    const currentViewType = this.previewService.getCurrentViewType();
    if(isArtworkType(currentViewType)) {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', artworkDimsDict[currentViewType].width, RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', artworkDimsDict[currentViewType].height, RendererStyleFlags2.DashCase);
    }
  }

  setCategoryFilter(categories: string[]) {
    this.categoryFilter = categories;
    this.actualCategoryFilter = categories.map(c=>c.replace(/&nbsp;/g,' '));
  }

  setParserFilter(parsers: string[]) {
    this.parserFilter = parsers;
    this.actualParserFilter = parsers.map(p=>p.replace(/&nbsp;/g,' '));
  }

  setSearchFilter(searchFilter: string) {
    this.filterValue = searchFilter;
    this.changeDetectionRef.detectChanges();
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

  getActualArtworkType(artworkType?: ArtworkType): ArtworkType {
    const currentViewType = this.previewService.getCurrentViewType();
    return isArtworkType(currentViewType) ? currentViewType : artworkType;
  }
  getCurrentViewType() {
    return this.previewService.getCurrentViewType();
  }

  setImageType(artworkViewType: ArtworkViewType) {
    this.previewService.setCurrentViewType(artworkViewType);
    this.setImageBoxSizes();
    this.closeListImages();
    this.changeDetectionRef.detectChanges();
  }

  getImagePool(poolKey: string, artworkType?: ArtworkType) {
    return this.previewService.getImages(artworkType)[poolKey];
  }

  getAppImages(app: PreviewDataApp, artworkType?: ArtworkType) {
    const actualArtworkType = this.getActualArtworkType(artworkType);
    return app.images[actualArtworkType];
  }

  getBackgroundImage(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.previewService.getCurrentImage(app, artworkType);
  }
  getBackgroundImageList(app: PreviewDataApp, index: number, artworkType?: ArtworkType){
    return this.previewService.getImage(app, index, artworkType)
  }

  setDetailsBackgroundImage(sgdbId: string) {
    const posterUrl = this.matchFixDict[sgdbId].posterUrl;
    return posterUrl ? posterUrl : require('../../assets/images/no-images.svg');
  }

  setBackgroundImage(appId: string, app: PreviewDataApp, image: ImageContent, 
    artworkType?: ArtworkType, imageIndex?: number, notLazy?: boolean) {
    const currentViewType = this.previewService.getCurrentViewType();
    const actualArtworkType: ArtworkType = this.getActualArtworkType(artworkType);
    if(this.appSettings.previewSettings.imageLoadStrategy=='loadLazy' && !notLazy && !this.inViewDict[appId + currentViewType]) { return null; }
    if (image == undefined) {
      let imagepool: string = app.images[actualArtworkType].imagePool;
      if (this.previewService.getImages(actualArtworkType)[imagepool].online)
        return require('../../assets/images/retrieving-images.svg');
      else
        return require('../../assets/images/no-images.svg');
    }
    else {
      if (image.loadStatus === 'notStarted') {
        if(isArtworkType(currentViewType)) {
          this.loadImage(app)
        } else {
          this.loadImage(app, artworkType, imageIndex);
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

  loadImage(app: PreviewDataApp, artworkType?: ArtworkType, imageIndex?: number) {
    this.previewService.loadImage(app, artworkType, imageIndex);
  }

  areImagesAvailable(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.previewService.areImagesAvailable(app, artworkType);
  }

  currentImageIndex(app: PreviewDataApp, artworkType?: ArtworkType) {
    const actualArtworkType = this.getActualArtworkType(artworkType);
    return app.images[actualArtworkType].imageIndex + 1;
  }

  maxImageIndex(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.previewService.getTotalLengthOfImages(app, artworkType);
  }

  addLocalImages(app: PreviewDataApp, artworkType?: ArtworkType) {
    this.fileSelector.multiple = true;
    this.fileSelector.accept = '.png, .jpeg, .jpg, .tga, .webp';
    const actualArtworkType = this.getActualArtworkType(artworkType);
    this.fileSelector.onChange = (target) => {
      if (target.files) {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        for (let i = 0; i < target.files.length; i++) {
          if (extRegex.test(path.extname(target.files[i].path))) {
            let imageUrl = url.encodeFile(target.files[i].path);
            this.previewService.addUniqueLocalImage(app.images[actualArtworkType].imagePool, {
              imageProvider: imageProviderNames.manual,
              imageUrl: imageUrl,
              loadStatus: 'done'
            },actualArtworkType, 'manual');
            this.previewService.setImageIndex(app, this.previewService.getTotalLengthOfImages(app, actualArtworkType, true) -1, actualArtworkType, true);
          }
        }
      }
    };
    this.fileSelector.trigger();
  }

  stopImageRetrieving() {
    this.imageProviderService.instance.stopUrlDownload();
  }

  save() {
    return this.previewService.saveData({removeAll: false, batchWrite: true});
  }

  remove() {
    for (const directory in this.previewData) {
      for (const userId in this.previewData[directory]) {
        for (const appId in this.previewData[directory][userId].apps) {
          this.previewData[directory][userId].apps[appId].status = 'remove';
        }
      }
    }
    return this.previewService.saveData({removeAll: false, batchWrite: false}).then((noError: boolean | void) => {
      if (noError) {
        this.closeAll()
        this.previewService.clearPreviewData();
      }
    });
  }

  closeFilters() {
    this.showFilters = false;
    this.renderer.setStyle(this.elementRef.nativeElement,'--filters-width','0%',RendererStyleFlags2.DashCase);
  }

  openFilters() {
    this.showFilters = true;
    this.renderer.setStyle(this.elementRef.nativeElement, '--filters-width', '300px', RendererStyleFlags2.DashCase);
  }

  toggleDetailsPerApp() {
    this.hideDetailsPerApp = ! this.hideDetailsPerApp;
    this.changeDetectionRef.detectChanges();
  }

  toggleFilters() {
    if(this.showFilters) {
      this.closeFilters();
    } else {
      this.openFilters();
    }
    this.changeDetectionRef.detectChanges();
  }

  setArtFilter(artFilter: boolean) {
    this.missingArtFilter = artFilter;
    this.changeDetectionRef.detectChanges();
  }

  setExceptionFilter(exceptionFilter: boolean) {
    this.exceptionFilter = exceptionFilter;
    this.changeDetectionRef.detectChanges();
  }

  updateDOM() {
    this.changeDetectionRef.detectChanges();
  }

  searchMatches(searchTitle: string) {
    this.previewService.getMatchFixes(searchTitle).then((games: any[])=>{
      this.matchFixDict = Object.fromEntries(games.map((x: any)=>[x.id.toString(), {name: x.name, posterUrl: x.posterUrl}]));
      this.matchFixIds = games.map((x:any)=>x.id.toString());
      this.detailsLoading = false;
      this.changeDetectionRef.detectChanges();
    })
  }
  searchForDetails() {
    if(this.detailsSearchText) {
      this.searchMatches(this.detailsSearchText);
    }
  }
  changeAppDetails(app: PreviewDataApp, steamDirectory: string, userId: string, appId: string) {
    this.clearDetails();
    this.cancelExcludes();
    this.closeListImages();
    this.detailsLoading = true;
    this.showDetails= true;
    this.renderer.setStyle(this.elementRef.nativeElement, '--details-width', '50%', RendererStyleFlags2.DashCase);
    this.changeDetectionRef.detectChanges()
    const exceptionId = this.userExceptionsService.makeExceptionId(app.executableLocation, app.extractedTitle, app.parserType)
    const existingException = this.userExceptionsService.getExceptionById(exceptionId);
    this.detailsException = existingException ? _.cloneDeep(existingException) : {
      newTitle: "",
      searchTitle: "",
      commandLineArguments: "",
      excludeArtwork: false,
      exclude: false,
      timeStamp: undefined
    }
    this.detailsOriginalExcludeArt = existingException ? existingException.excludeArtwork : false;
    this.detailsApp = {
      appId: appId,
      app: app,
      steamDirectory: steamDirectory,
      userId: userId
    };
    this.searchMatches(this.detailsApp.app.extractedTitle);
  }

  fixMatchSearch(sgdbId: string) {
    this.detailsException.searchTitle = `\${gameid:${sgdbId}}`;
  }

  fixMatchTitle(sgdbId: string) {
    this.detailsException.newTitle = this.matchFixDict[sgdbId].name;
  }

  fixMatch(sgdbId: string) {
    this.matchFix = sgdbId;
    this.fixMatchSearch(sgdbId);
    this.fixMatchTitle(sgdbId);
  }

  clearDetails() {
    this.detailsSearchText = '';
    this.matchFix = '';
    this.detailsException = undefined;
    this.detailsApp = undefined;
  }
  closeDetails() {
    this.clearDetails();
    this.showDetails = false;
    this.renderer.setStyle(this.elementRef.nativeElement, '--details-width','0%', RendererStyleFlags2.DashCase);
    this.detailsLoading = false;
    this.changeDetectionRef.detectChanges();
  }

  openListImages(app: PreviewDataApp, steamDir: string, userId: string, appId: string) {
    this.closeDetails();
    this.cancelExcludes();
    this.showListImages = true;
    this.renderer.setStyle(this.elementRef.nativeElement, '--list-images-width', '50%', RendererStyleFlags2.DashCase);
    this.currentApp={
      app: app,
      appId: appId,
      steamDirectory: steamDir,
      userId: userId
    };
    this.listImagesRanges = this.previewService.getRanges(app, this.listImagesArtworkType);
    this.changeDetectionRef.detectChanges()

  }
  closeListImages() {
    this.showListImages = false;
    this.renderer.setStyle(this.elementRef.nativeElement, '--list-images-width','0%',RendererStyleFlags2.DashCase);
  }
  changeListImagesArtworkType(app: PreviewDataApp, artworkType: ArtworkType) {
    this.listImagesArtworkType = artworkType;
    this.listImagesRanges = this.previewService.getRanges(app, this.listImagesArtworkType);
    this.changeDetectionRef.detectChanges();
  }

  deleteExceptionDetails() {
    if(this.detailsApp) {
      const {steamDirectory, userId, appId, app} = this.detailsApp;
      const exceptionId = this.userExceptionsService.makeExceptionId(app.executableLocation, app.extractedTitle, app.parserType)
      this.userExceptionsService.deleteExceptionById(exceptionId);
      this.refreshAfterSavingDetails(steamDirectory,userId,appId);
      this.closeDetails();
      this.generatePreviewData();
    }
  }

  saveDetails() {
    if(this.detailsApp) {
      const {steamDirectory, userId, appId, app} = this.detailsApp;
      const {newTitle, searchTitle, commandLineArguments, excludeArtwork} = this.detailsException;
      if(newTitle) {
        this.previewData[steamDirectory][userId].apps[appId].title = newTitle;
        if(superTypesMap[app.parserType] !== 'ArtworkOnly') {
          const changedId = steam.generateAppId(app.executableLocation, newTitle);
          this.previewData[steamDirectory][userId].apps[appId].changedId = changedId;
        }
      }
      if(commandLineArguments) {
        this.previewData[steamDirectory][userId].apps[appId].argumentString = commandLineArguments;
      }
      if(searchTitle && !excludeArtwork) {
        for(const artworkType of artworkTypes) {
          const oldPool = this.previewData[steamDirectory][userId].apps[appId].images[artworkType].imagePool;
          this.previewData[steamDirectory][userId].apps[appId].images[artworkType].imagePool = searchTitle;
          this.previewData[steamDirectory][userId].apps[appId].images[artworkType].singleProviders.steam = undefined;
          this.previewService.updateAppImages(searchTitle, oldPool, artworkType)
        }
      }
      if(excludeArtwork != this.detailsOriginalExcludeArt) {
        for(const artworkType of artworkTypes) {
          this.previewService.updateLocalArtworkOnly(searchTitle, artworkType, excludeArtwork)
        }
      }
      if(newTitle||searchTitle||commandLineArguments||(excludeArtwork!=this.detailsOriginalExcludeArt)) {
        const exceptionId = this.userExceptionsService.makeExceptionId(app.executableLocation, app.extractedTitle, app.parserType);
        this.userExceptionsService.addExceptionById(exceptionId, app.extractedTitle, {
          newTitle: newTitle,
          searchTitle: searchTitle,
          commandLineArguments: commandLineArguments,
          excludeArtwork: excludeArtwork,
          exclude: false,
          timeStamp: Date.now(),
        })
        this.refreshAfterSavingDetails(steamDirectory,userId,appId);
      }
      this.closeDetails();
    }
  }

  private refreshAfterSavingDetails(steamDirectory: string, userId: string, appId: string) {
    if(!isArtworkType(this.previewService.getCurrentViewType())) { 
      for(const artworkType of artworkTypes) {
        this.refreshImages(this.previewData[steamDirectory][userId].apps[appId], artworkType)
      }
    } else {
      this.refreshImages(this.previewData[steamDirectory][userId].apps[appId]);
    }
  }

  excludeAppId(steamDirectory: string, userId: string, appId: string, override?: boolean) {
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

  isAppVisible(app: PreviewDataApp) {
    const searchFilter = this.fuzzyTest.transform(app.title, this.filterValue);
    const categoryFilter = this.intersectionTest.transform(app.steamCategories, this.actualCategoryFilter);
    const configFilter = this.intersectionTest.transform([app.configurationTitle], this.actualParserFilter);
    let missingArtFilter = true;
    if(this.missingArtFilter) {
      const currentViewType = this.previewService.getCurrentViewType();
      if(isArtworkType(currentViewType)) {
        missingArtFilter = !this.previewService.getCurrentImage(app)
      }
      else {
        missingArtFilter = artworkTypes.map(t => !this.previewService.getCurrentImage(app,t)).reduce((x,y)=>x||y);
      }
    }
    let exceptionFilter = true;
    if(this.exceptionFilter) {
      const exceptionId = this.userExceptionsService.makeExceptionId(app.executableLocation, app.extractedTitle, app.parserType);
      exceptionFilter = !!this.userExceptionsService.getExceptionById(exceptionId)
    }
    const excludesArtOnlyFilter = !this.showExcludes || superTypesMap[app.parserType]!=='ArtworkOnly'
    return searchFilter 
    && categoryFilter 
    && configFilter 
    && missingArtFilter 
    && exceptionFilter
    && excludesArtOnlyFilter;
  }

  excludeVisible() {
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

  includeVisible() {
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

  showExclusions() {
    this.closeDetails();
    this.closeListImages();
    this.renderer.setStyle(this.elementRef.nativeElement, '--excludes-lower-width', '50%', RendererStyleFlags2.DashCase);
    this.showExcludes = true;
  }

  cancelExcludes() {
    this.showExcludes = false;
    this.renderer.setStyle(this.elementRef.nativeElement, '--excludes-lower-width', '0%', RendererStyleFlags2.DashCase);
    this.excludedAppIds = {};
    this.exclusionCount = 0;
  }

  saveExcludes() {
    let exceptionKeys: {exceptionId: string, extractedTitle: string}[] = [];
    for(const steamDirectory in this.previewData) {
      if(this.excludedAppIds[steamDirectory]) {
        for(const userId in this.previewData[steamDirectory]) {
          if(this.excludedAppIds[steamDirectory][userId]) {
            let newKeys = Object.keys(this.excludedAppIds[steamDirectory][userId]).filter((appId: string)=> {
              return !!this.excludedAppIds[steamDirectory][userId][appId]
            }).map((appId: string) =>{
              const app = this.previewData[steamDirectory][userId].apps[appId];
              const exceptionId = steam.generateShortAppId(app.executableLocation, app.extractedTitle)
              return {exceptionId: exceptionId, extractedTitle: app.extractedTitle}
            });
            exceptionKeys = exceptionKeys.concat(newKeys)
          }
        }
      }
    }
    for(const exceptionKey of exceptionKeys) {
      this.userExceptionsService.addExceptionById(exceptionKey.exceptionId, exceptionKey.extractedTitle, {
        newTitle: '',
        searchTitle: '',
        timeStamp: Date.now(),
        commandLineArguments: '',
        exclude: true,
        excludeArtwork: false
      })
    }
    const putBackKeys = Object.keys(this.excludePutBacks).filter(putBackKey=>this.excludePutBacks[putBackKey]);
    for(const putBackKey of putBackKeys) {
      this.userExceptionsService.putBack(putBackKey);
      delete this.excludePutBacks[putBackKey];
    }
    this.cancelExcludes();
    this.generatePreviewData();
  }

  refreshImages(app: PreviewDataApp, artworkType?: ArtworkType) {
    if(!isArtworkType(this.previewService.getCurrentViewType())) {
      this.previewService.downloadImageUrls(artworkType, [app.images[artworkType].imagePool]);
    } else {
      //TODO why are we refreshing all artwork types here
      for(const artworkType of artworkTypes) {
        this.previewService.downloadImageUrls(artworkType,[app.images[artworkType].imagePool]);
      }
    }
  }

  saveImage(image: ImageContent, title: string) {
    FileSaver.saveAs(image.imageUrl, title.replace(/[/\\?%*:|"<>]/g, '-'))
  }

  previousImage(app: PreviewDataApp, artworkType?: ArtworkType) {
    const actualArtworkType = this.getActualArtworkType(artworkType);
    this.previewService.setImageIndex(app, app.images[actualArtworkType].imageIndex - 1, actualArtworkType);
  }

  nextImage(app: PreviewDataApp, artworkType?: ArtworkType) {
    const actualArtworkType = this.getActualArtworkType(artworkType);
    this.previewService.setImageIndex(app, app.images[actualArtworkType].imageIndex + 1, actualArtworkType);
  }

  chooseImage(app: PreviewDataApp, imageIndex: number, artworkType?: ArtworkType) {
    const actualArtworkType = this.getActualArtworkType(artworkType);
    this.previewService.setImageIndex(app, imageIndex, actualArtworkType);

  }

  setImageSizeFromInput(target: EventTarget, save: boolean = false) {
    this.setImageSize(Number((target as HTMLInputElement).value), save)
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

  onScrollEnd = _.debounce(() => {
    this.scrollingEntries = false;
    this.changeDetectionRef.detectChanges();
  }, 150);

  onScroll() {
    this.scrollingEntries = true;
    this.onScrollEnd();
  }

  sortedAppIds(apps: PreviewDataApps) {
    return Object.keys(apps).sort((a,b)=>(apps[a][this.listSortBy as keyof PreviewDataApp] as string).localeCompare(apps[b][this.listSortBy as keyof PreviewDataApp] as string))
  }

  niceAppTitle(app: PreviewDataApp) {
    if(superTypesMap[app.parserType] == 'ArtworkOnly') {
      return app.title
    }
    return `${app.title} (${app.filePath})`
  }

  async exportSelection() {
    await this.previewService.exportSelection();
  }

  async importSelection() {
    await this.previewService.importSelection();
  }
}