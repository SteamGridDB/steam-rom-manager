import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Renderer2, ElementRef, RendererStyleFlags2, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { PreviewService, SettingsService, ImageProviderService, IpcService } from "../services";
import { PreviewData, PreviewDataApp, PreviewVariables, AppSettings, ImageContent, SelectItem, UserConfiguration } from "../../models";
import { APP } from '../../variables';
import { FileSelector } from '../../lib';
import { artworkTypes, artworkViewTypes, artworkNamesDict, artworkDimsDict } from '../../lib/artwork-types';
import * as url from '../../lib/helpers/url';
import * as FileSaver from 'file-saver';
import * as appImage from '../../lib/helpers/app-image';
import * as _ from 'lodash';
import * as path from 'path';

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
  private filterValue: string = '';
  private categoryFilter: string[] = [];
  private allCategories: string[] = [];
  private actualCategoryFilter: string[] = [];
  private parserFilter: string[] = [];
  private allParsers: string[] = [];
  private actualParserFilter: string[] = [];
  private imageTypes: SelectItem[];
  private scrollingEntries: boolean = false;
  private fileSelector: FileSelector = new FileSelector();
  private CLI_MESSAGE: BehaviorSubject<string> = new BehaviorSubject("");

  constructor(
    private previewService: PreviewService,
    private settingsService: SettingsService,
    private imageProviderService: ImageProviderService,
    private changeDetectionRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private activatedRoute: ActivatedRoute,
    private ipcService: IpcService
  ) {
    this.previewData = this.previewService.getPreviewData();
    this.previewVariables = this.previewService.getPreviewVariables();
    if(this.previewService.getPreviewData()) {
      this.allCategories = this.previewService.getAllCategories();
      this.allParsers = this.previewService.getAllParsers();
      this.previewData = this.previewService.getPreviewData();
    }
    this.subscriptions.add(this.previewService.getPreviewDataChange().subscribe(_.debounce(() => {
      this.allCategories = this.previewService.getAllCategories();
      this.allParsers = this.previewService.getAllParsers();
      this.previewData = this.previewService.getPreviewData();
      this.changeDetectionRef.detectChanges();
    }, 50)));
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
          if(this.previewVariables.numberOfListItems > 0 && this.previewVariables.numberOfQueriedImages >= 0) {
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
    if(this.previewService.getImageType()!='games') {
      imageType=this.previewService.getImageType()
    }
    this.fileSelector.onChange = (target) => {
      if (target.files) {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        for (let i = 0; i < target.files.length; i++) {
          if (extRegex.test(path.extname(target.files[i].path))) {
            let imageUrl = url.encodeFile(target.files[i].path);
            this.previewService.addUniqueImage(app.images[imageType].imagePool, {
              imageProvider: 'LocalStorage',
              imageUrl: imageUrl,
              loadStatus: 'done'
            }, imageType);
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

  private async exportSelection() {
    await this.previewService.exportSelection();
  }

  private async importSelection() {
    await this.previewService.importSelection();
  }
}
