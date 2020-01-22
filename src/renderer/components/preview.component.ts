import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Renderer2, ElementRef, RendererStyleFlags2, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { PreviewService, SettingsService, ImageProviderService } from "../services";
import { PreviewData, PreviewDataApp, PreviewVariables, AppSettings, ImageContent } from "../../models";
import { APP } from '../../variables';
import { FileSelector } from '../../lib';
import * as url from '../../lib/helpers/url';
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
  private imageTypes: string[];
  private scrollingEntries: boolean = false;
  private fileSelector: FileSelector = new FileSelector();

  constructor(private previewService: PreviewService, private settingsService: SettingsService, private imageProviderService: ImageProviderService, private changeDetectionRef: ChangeDetectorRef, private renderer: Renderer2, private elementRef: ElementRef) {
    this.previewData = this.previewService.getPreviewData();
    this.previewVariables = this.previewService.getPreviewVariables();
    this.subscriptions.add(this.previewService.getPreviewDataChange().subscribe(_.debounce(() => {
      this.previewData = this.previewService.getPreviewData();
      this.changeDetectionRef.detectChanges();
    }, 50)));
    this.appSettings = this.settingsService.getSettings();
    this.imageTypes = this.previewService.getImageTypes();
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
    }
  }

  ngAfterContentInit() {
    this.setImageSize(this.appSettings.previewSettings.imageZoomPercentage);
    this.setImageBoxSizes();
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private setImageType(imageType: string) {
    this.previewService.setImageType(imageType);
    this.setImageBoxSizes();
  }
  private getImagePool(poolKey: string) {
    return this.previewService.images[poolKey];
  }

  private getAppImages(app: PreviewDataApp) {
    if (this.previewService.getImageType() === 'long') {
      return app.images;
    } else if (this.previewService.getImageType() === 'tall') {
      return app.tallimages;
    } else if (this.previewService.getImageType() === 'hero') {
      return app.heroimages;
    } else if (this.previewService.getImageType() === 'logo') {
      return app.logoimages;
    }
  }

  private getBackgroundImage(app: PreviewDataApp) {
    return this.previewService.getCurrentImage(app);
  }

  private getGameBackgroundImages(app: PreviewDataApp) {
    return this.previewService.getAllCurrentImages(app);
  }
  private getGameAppImages(app: PreviewDataApp) {
    return {
      "long": app.images,
      "tall": app.tallimages,
      "hero": app.heroimages,
      "logo": app.logoimages
    }
  }

  private setBackgroundImage(app: PreviewDataApp, image: ImageContent) {
    if (image == undefined) {
      let imagepool: string;
      if (this.previewService.getImageType()==='long') {
        imagepool = app.tallimages.imagePool;
      } else if (this.previewService.getImageType()==='tall') {
        imagepool = app.tallimages.imagePool;
      } else if (this.previewService.getImageType()==='hero') {
        imagepool = app.heroimages.imagePool;
      } else if (this.previewService.getImageType()==='logo') {
        imagepool = app.logoimages.imagePool;
      }
      if (this.previewService.images[imagepool].retrieving)
        return require('../../assets/images/retrieving-images.svg');
      else
        return require('../../assets/images/no-images.svg');
    }
    else {
      if (image.loadStatus === 'notStarted') {
        this.loadImage(app);
        return require('../../assets/images/downloading-image.svg');
      }
      else if (image.loadStatus === 'downloading')
        return require('../../assets/images/downloading-image.svg');
      else if (image.loadStatus === 'done')
        return image.imageUrl;
      else
        return require('../../assets/images/failed-image-download.svg');
    }
  }
  private setGameBackgroundImage(app: PreviewDataApp, image: ImageContent, imagePool: string, imagetype: string) {
    if(image == undefined) {
      if(this.previewService.images[imagePool].retrieving)
        return require('../../assets/images/retrieving-images.svg');
      else
        return require('../../assets/images/no-images.svg');
    } else {
      if (image.loadStatus === 'notStarted') {
        this.loadImage(app);
        return require('../../assets/images/downloading-image.svg');
      }
      else if (image.loadStatus === 'downloading')
        return require('../../assets/images/downloading-image.svg');
      else if (image.loadStatus === 'done')
        return image.imageUrl;
      else
        return require('../../assets/images/failed-image-download.svg');
    }
  }

  private loadImage(app: PreviewDataApp, imagetype?: string) {
    this.previewService.loadImage(app, imagetype);
  }

  private areImagesAvailable(app: PreviewDataApp) {
    return this.previewService.areImagesAvailable(app);
  }

  private currentImageIndex(app: PreviewDataApp, imagetype?: string) {
    if(!imagetype) {
      imagetype=this.previewService.getImageType()
    }
    if (imagetype === 'long') {
      return app.images.imageIndex + 1;
    } else if (imagetype === 'tall') {
      return app.tallimages.imageIndex + 1;
    } else if (imagetype === 'hero') {
      return app.heroimages.imageIndex + 1;
    } else if (imagetype === 'logo') {
      return app.logoimages.imageIndex +1;
    }

  }

  private maxImageIndex(app: PreviewDataApp, imagetype?: string) {
    return this.previewService.getTotalLengthOfImages(app, imagetype);
  }

  private addLocalImages(app: PreviewDataApp, imagetype?: string) {
    this.fileSelector.multiple = true;
    this.fileSelector.accept = '.png, .jpeg, .jpg, .tga';
    if(!imagetype) {
      imagetype=this.previewService.getImageType()
    }
    this.fileSelector.onChange = (target) => {
      if (target.files) {
        let extRegex = /png|tga|jpg|jpeg/i;
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
    if(imagetype) {
      this.previewService.downloadImageUrls(imagetype,[app.images.imagePool], app.imageProviders);
    } else {
      this.previewService.downloadImageUrls('long',[app.images.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('tall',[app.tallimages.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('hero',[app.heroimages.imagePool], app.imageProviders);
      this.previewService.downloadImageUrls('logo',[app.logoimages.imagePool], app.imageProviders);
    }
  }

  private previousImage(app: PreviewDataApp, imagetype?: string) {
    if(!imagetype){
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
    }

  }

  private nextImage(app: PreviewDataApp, imagetype?: string) {
    if(!imagetype){
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
    }
  }

  private setFallbackIcon(imageElement: HTMLImageElement) {
    imageElement.src = require('../../assets/images/crossed-eye.svg');
  }

  private previousIcon(app: PreviewDataApp) {
    this.previewService.setIconIndex(app, app.currentIconIndex - 1);
  }

  private nextIcon(app: PreviewDataApp) {
    this.previewService.setIconIndex(app, app.currentIconIndex + 1);
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
}
