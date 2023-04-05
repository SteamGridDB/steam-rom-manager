import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Renderer2, ElementRef, RendererStyleFlags2, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { PreviewService, SettingsService, ImageProviderService } from "../services";
import { PreviewData, PreviewDataApp, PreviewVariables, AppSettings, ImageContent, SelectItem } from "../../models";
import { APP } from '../../variables';
import { FileSelector } from '../../lib';
import * as url from '../../lib/helpers/url';
import * as FileSaver from 'file-saver';
import * as appImage from '../../lib/helpers/app-image';
import * as _ from 'lodash';
import * as path from 'path';

const imageTypeDict: {[k:string]: string} = {
  long: 'Banners',
  tall: 'Portraits',
  hero: 'Heroes',
  logo: 'Logos',
  icon: 'Icons',
  games: 'All Artwork'
};

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

  constructor(private previewService: PreviewService, private settingsService: SettingsService, private imageProviderService: ImageProviderService, private changeDetectionRef: ChangeDetectorRef, private renderer: Renderer2, private elementRef: ElementRef) {
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
    this.imageTypes = this.previewService.getImageTypes().map((imageType: string)=>{
      return {value: imageType, displayValue: imageTypeDict[imageType]}
    });
  }

  generatePreviewData() {
    this.previewService.generatePreviewData();
  }

  preloadImages() {
    this.previewService.preloadImages();
  }
  setImageBoxSizes() {
    if(this.previewService.getImageType()=='long') {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', '920px', RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', '430px', RendererStyleFlags2.DashCase);
    } else if(this.previewService.getImageType()=='tall') {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', '600px', RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', '900px', RendererStyleFlags2.DashCase);
    } else if(this.previewService.getImageType()=='hero') {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', '910px', RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', '296px', RendererStyleFlags2.DashCase);
    } else if(this.previewService.getImageType()=='logo') {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', '960px', RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', '540px', RendererStyleFlags2.DashCase);
    } else if(this.previewService.getImageType()=='icon') {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', '400px', RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', '400px', RendererStyleFlags2.DashCase);
    } else if(this.previewService.getImageType()=='games') {
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-width-max', '920px', RendererStyleFlags2.DashCase);
      this.renderer.setStyle(this.elementRef.nativeElement, '--image-height-max', '430px', RendererStyleFlags2.DashCase);
    }
  }
  setCategoryFilter(categories: string[]) {
    this.categoryFilter = categories;
    this.actualCategoryFilter = categories.map(c=>c.replace(/&nbsp;/g,' '));
  }
  setParserFilter(parsers: string[]) {
    this.parserFilter= parsers;
    this.actualParserFilter = parsers.map(p=>p.replace(/&nbsp;/g,' '));
  }

  ngAfterContentInit() {
    this.setImageSize(this.appSettings.previewSettings.imageZoomPercentage);
    this.setImageBoxSizes();
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
  private getImagePool(poolKey: string, imagetype?: string) {
    return this.previewService.getImages(imagetype)[poolKey];
  }

  private getAppImages(app: PreviewDataApp, imagetype?: string) {
    if (this.previewService.getImageType() === 'long' || (this.previewService.getImageType() === 'games' && imagetype ==='long')) {
      return app.images;
    } else if (this.previewService.getImageType() === 'tall' || (this.previewService.getImageType() === 'games' && imagetype ==='tall')) {
      return app.tallimages;
    } else if (this.previewService.getImageType() === 'hero' || (this.previewService.getImageType() === 'games' && imagetype ==='hero')) {
      return app.heroimages;
    } else if (this.previewService.getImageType() === 'logo' || (this.previewService.getImageType() === 'games' && imagetype ==='logo')) {
      return app.logoimages;
    } else if (this.previewService.getImageType() === 'icon' || (this.previewService.getImageType() === 'games' && imagetype ==='icon')) {
      return app.icons;
    }
  }

  private getBackgroundImage(app: PreviewDataApp, imagetype?: string) {
    return this.previewService.getCurrentImage(app, imagetype);
  }

  private setBackgroundImage(app: PreviewDataApp, image: ImageContent, imagetype?: string) {
    if (image == undefined) {
      let imagepool: string;
      if (this.previewService.getImageType()==='long' || (this.previewService.getImageType()==='games' && imagetype==='long')) {
        imagepool = app.tallimages.imagePool;
      } else if (this.previewService.getImageType()==='tall' || (this.previewService.getImageType()==='games' && imagetype==='tall')) {
        imagepool = app.tallimages.imagePool;
      } else if (this.previewService.getImageType()==='hero' || (this.previewService.getImageType()==='games' && imagetype==='hero')) {
        imagepool = app.heroimages.imagePool;
      } else if (this.previewService.getImageType()==='logo' || (this.previewService.getImageType()==='games' && imagetype==='logo')) {
        imagepool = app.logoimages.imagePool;
      } else if (this.previewService.getImageType()==='icon' || (this.previewService.getImageType()==='games' && imagetype==='icon')) {
        imagepool = app.icons.imagePool;
      }
      if (this.previewService.getImages(imagetype)[imagepool].retrieving)
        return require('../../assets/images/retrieving-images.svg');
      else
        return require('../../assets/images/no-images.svg');
    }
    else {
      if (image.loadStatus === 'notStarted') {
        if(this.previewService.getImageType()==='games') {
          this.loadImage(app, imagetype)
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

  private loadImage(app: PreviewDataApp, imagetype?: string) {
    this.previewService.loadImage(app, imagetype);
  }

  private areImagesAvailable(app: PreviewDataApp, imagetype?: string) {
    return this.previewService.areImagesAvailable(app, imagetype);
  }

  private currentImageIndex(app: PreviewDataApp, imagetype?: string) {
    if(this.previewService.getImageType()!='games') {
      imagetype=this.previewService.getImageType()
    }
    if (imagetype === 'long') {
      return app.images.imageIndex + 1;
    } else if (imagetype === 'tall') {
      return app.tallimages.imageIndex + 1;
    } else if (imagetype === 'hero') {
      return app.heroimages.imageIndex + 1;
    } else if (imagetype === 'logo') {
      return app.logoimages.imageIndex + 1;
    } else if (imagetype === 'icon') {
      return app.icons.imageIndex + 1;
    }

  }

  private maxImageIndex(app: PreviewDataApp, imagetype?: string) {
    return this.previewService.getTotalLengthOfImages(app, imagetype);
  }

  private addLocalImages(app: PreviewDataApp, imagetype?: string) {
    this.fileSelector.multiple = true;
    this.fileSelector.accept = '.png, .jpeg, .jpg, .tga, .webp';
    if(this.previewService.getImageType()!='games') {
      imagetype=this.previewService.getImageType()
    }
    this.fileSelector.onChange = (target) => {
      if (target.files) {
        let extRegex = /png|tga|jpg|jpeg|webp/i;
        for (let i = 0; i < target.files.length; i++) {
          if (extRegex.test(path.extname(target.files[i].path))) {
            let imageUrl = url.encodeFile(target.files[i].path);
            if (imagetype === 'long') {
              this.previewService.addUniqueImage(app.images.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl,
                loadStatus: 'done'
              }, 'long');
            } else if (imagetype === 'tall') {
              this.previewService.addUniqueImage(app.tallimages.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl,
                loadStatus: 'done'
              }, 'tall');
            } else if (imagetype === 'hero') {
              this.previewService.addUniqueImage(app.heroimages.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl,
                loadStatus: 'done'
              }, 'hero');
            } else if (imagetype === 'logo') {
              this.previewService.addUniqueImage(app.logoimages.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl,
                loadStatus: 'done'
              }, 'logo');
            } else if (imagetype === 'icon') {
              this.previewService.addUniqueImage(app.icons.imagePool, {
                imageProvider: 'LocalStorage',
                imageUrl,
                loadStatus: 'done'
              }, 'icon');
            }
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
    this.previewService.saveData(false);
  }

  private remove() {
    for (const directory in this.previewData) {
      for (const userId in this.previewData[directory]) {
        for (const appId in this.previewData[directory][userId].apps) {
          this.previewData[directory][userId].apps[appId].status = 'remove';
        }
      }
    }
    this.previewService.saveData(false).then((noError: boolean | void) => {
      if (noError)
        this.previewService.clearPreviewData();
    });
  }

  private refreshImages(app: PreviewDataApp, imagetype?: string) {
    if(this.previewService.getImageType()=='games') {
      this.previewService.downloadImageUrls(imagetype,[app.images.imagePool], app.imageProviders);
    } else {
      this.previewService.downloadImageUrls('long',[app.images.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('tall',[app.tallimages.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('hero',[app.heroimages.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('logo',[app.logoimages.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('icon',[app.icons.imagePool], app.imageProviders);
    }
  }
  private saveImage(image: ImageContent, title: string) {
    FileSaver.saveAs(image.imageUrl, title.replace(/[/\\?%*:|"<>]/g, '-'))
  }

  private previousImage(app: PreviewDataApp, imagetype?: string) {
    if(this.previewService.getImageType()!='games'){
      imagetype = this.previewService.getImageType();
    }
    if (imagetype === 'long') {
      this.previewService.setImageIndex(app, app.images.imageIndex - 1, imagetype);
    } else if (imagetype === 'tall') {
      this.previewService.setImageIndex(app, app.tallimages.imageIndex - 1, imagetype);
    } else if (imagetype === 'hero') {
      this.previewService.setImageIndex(app, app.heroimages.imageIndex - 1, imagetype);
    } else if (imagetype === 'logo') {
      this.previewService.setImageIndex(app, app.logoimages.imageIndex - 1, imagetype);
    } else if (imagetype === 'icon') {
      this.previewService.setImageIndex(app, app.icons.imageIndex - 1, imagetype);
    }

  }

  private nextImage(app: PreviewDataApp, imagetype?: string) {
    if(this.previewService.getImageType()!='games'){
      imagetype = this.previewService.getImageType();
    }
    if (imagetype === 'long') {
      this.previewService.setImageIndex(app, app.images.imageIndex + 1, imagetype);
    } else if (imagetype === 'tall') {
      this.previewService.setImageIndex(app, app.tallimages.imageIndex + 1, imagetype);
    } else if (imagetype === 'hero') {
      this.previewService.setImageIndex(app, app.heroimages.imageIndex + 1, imagetype);
    } else if (imagetype === 'logo') {
      this.previewService.setImageIndex(app, app.logoimages.imageIndex + 1, imagetype);
    } else if (imagetype === 'icon') {
      this.previewService.setImageIndex(app, app.icons.imageIndex + 1, imagetype);
    }

  }

  private setImageSize(value: number, save: boolean = false) {
    if (this.elementRef && this.elementRef.nativeElement) {
      if (typeof value === 'string')
        value = parseFloat(value);

      if (value <= 100) {
        if (value < 30)
          value = 30;
      }
      else
        value = 100;

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
