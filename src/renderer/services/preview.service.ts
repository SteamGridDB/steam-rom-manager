import { Injectable } from "@angular/core";
import { ParsersService } from "./parsers.service";
import { LoggerService } from "./logger.service";
import { SettingsService } from "./settings.service";
import { ImageProviderService } from "./image-provider.service";
import {
  ImageContent,
  PreviewDataApp,
  UserConfiguration,
  OnlineProviderType,
  MultiLocalProviderType,
  ArtworkType,
  ArtworkViewType,
  isArtworkType,
} from "../../models";
import { APP } from "../../variables";
import { defaultArtworkType } from "../../lib/artwork-types";
import { dialog } from "@electron/remote";
import { PreviewEngine } from "../../core/preview-engine";

// Angular facade over the core PreviewEngine. Adds what only the UI has:
// which artwork type is being viewed, which entries are on screen, loading
// images into <img> to measure them, and folder pickers.
@Injectable()
export class PreviewService {
  readonly engine: PreviewEngine;
  private currentViewType: ArtworkViewType = defaultArtworkType;
  inViewDict: { [innerHTML: string]: boolean } = {};

  constructor(
    private parsersService: ParsersService,
    private loggerService: LoggerService,
    private imageProviderService: ImageProviderService,
    private settingsService: SettingsService,
  ) {
    this.engine = new PreviewEngine(
      this.loggerService,
      this.parsersService.store,
      this.imageProviderService.instance,
      this.settingsService.store,
      (image) => {
        if (
          this.settingsService.getSettings().previewSettings
            .imageLoadStrategy == "loadPre"
        ) {
          this.preloadImage(image);
        }
      },
    );
  }

  get lang() {
    return APP.lang.preview.service;
  }

  // The artwork type a call refers to: the one on screen if a single type
  // is being viewed, else the one passed in.
  private resolveType(
    artworkType?: ArtworkType,
    ignoreCurrentType: boolean = false,
  ): ArtworkType {
    return !ignoreCurrentType && isArtworkType(this.currentViewType)
      ? this.currentViewType
      : artworkType;
  }

  getPreviewData() {
    return this.engine.getPreviewData();
  }

  getPreviewDataChange() {
    return this.engine.getPreviewDataChange();
  }

  getBatchProgress() {
    return this.engine.getBatchProgress();
  }

  getPreviewVariables() {
    return this.engine.getPreviewVariables();
  }

  getCurrentViewType() {
    return this.currentViewType;
  }

  setCurrentViewType(viewType: ArtworkViewType) {
    this.currentViewType = viewType;
  }

  onLoadUserConfigurations(
    callback: (userConfigurations: UserConfiguration[]) => void,
  ) {
    return this.parsersService.onLoad(callback);
  }

  generatePreviewData() {
    return this.engine.generatePreviewData();
  }

  getMatchFixes(title: string) {
    return this.engine.getMatchFixes(title);
  }

  updateAppImages(imageKey: string, oldPool: string, artworkType: ArtworkType) {
    return this.engine.updateAppImages(imageKey, oldPool, artworkType);
  }

  updateLocalArtworkOnly(
    imageKey: string,
    artworkType: ArtworkType,
    excludeArtwork: boolean,
  ) {
    return this.engine.updateLocalArtworkOnly(
      imageKey,
      artworkType,
      excludeArtwork,
    );
  }

  saveData(options: { batchWrite: boolean; removeAll: boolean }) {
    return this.engine.saveData(options);
  }

  setImageIndex(
    app: PreviewDataApp,
    index: number,
    artworkType?: ArtworkType,
    ignoreCurrentType: boolean = false,
  ) {
    this.engine.setImageIndex(
      app,
      index,
      this.resolveType(artworkType, ignoreCurrentType),
    );
  }

  areImagesAvailable(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.getTotalLengthOfImages(app, artworkType) > 0;
  }

  getTotalLengthOfImages(
    app: PreviewDataApp,
    artworkType?: ArtworkType,
    ignoreCurrentType: boolean = false,
  ) {
    return this.engine.getTotalLengthOfImages(
      app,
      this.resolveType(artworkType, ignoreCurrentType),
    );
  }

  getCurrentImage(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.engine.getCurrentImage(app, this.resolveType(artworkType));
  }

  getImages(artworkType?: ArtworkType) {
    return this.engine.getImages(this.resolveType(artworkType));
  }

  getImage(app: PreviewDataApp, index: number, artworkType?: ArtworkType) {
    return this.engine.getImage(app, index, this.resolveType(artworkType));
  }

  getRanges(app: PreviewDataApp, artworkType?: ArtworkType) {
    return this.engine.getRanges(app, this.resolveType(artworkType));
  }

  clearPreviewData() {
    this.engine.clearPreviewData();
  }

  getAllCategories() {
    return this.engine.getAllCategories();
  }

  getAllParsers() {
    return this.engine.getAllParsers();
  }

  downloadImageUrls(artworkType: ArtworkType, imKeys?: string[]) {
    return this.engine.downloadImageUrls(artworkType, imKeys);
  }

  addUniqueImage(
    imageKey: string,
    content: ImageContent,
    artworkType: ArtworkType,
    provider: OnlineProviderType,
    preinsert?: boolean,
  ) {
    return this.engine.addUniqueImage(
      imageKey,
      content,
      artworkType,
      provider,
      preinsert,
    );
  }

  addUniqueLocalImage(
    imageKey: string,
    content: ImageContent,
    artworkType: ArtworkType,
    provider: MultiLocalProviderType,
    preinsert?: boolean,
  ) {
    return this.engine.addUniqueLocalImage(
      imageKey,
      content,
      artworkType,
      provider,
      preinsert,
    );
  }

  // Loads an image into an <img> to learn its size/whether it loads.
  private loadIntoImage(image: ImageContent, onError?: () => void) {
    image.loadStatus = "downloading";
    this.engine.changed();
    const imageLoader = new Image();
    imageLoader.onload = () => {
      image.loadStatus = "done";
      image.imageRes = `${imageLoader.width}x${imageLoader.height}`;
      this.engine.changed();
    };
    imageLoader.onerror = () => {
      onError?.();
      image.loadStatus = "failed";
      this.engine.changed();
    };
    imageLoader.src = image.imageUrl;
  }

  loadImage(
    app: PreviewDataApp,
    artworkType?: ArtworkType,
    imageIndex?: number,
  ) {
    if (!app) {
      return;
    }
    const type = this.resolveType(artworkType);
    const image = imageIndex
      ? this.engine.getImage(app, imageIndex, type)
      : this.engine.getCurrentImage(app, type);
    if (
      image !== undefined &&
      (image.loadStatus === "notStarted" || image.loadStatus === "failed")
    ) {
      if (image.loadStatus === "failed") {
        this.loggerService.info(
          this.lang.info.retryingDownload__i.interpolate({
            imageUrl: image.imageUrl,
            appTitle: app.title,
          }),
        );
      }
      this.loadIntoImage(image, () =>
        this.loggerService.error(
          this.lang.errors.retryingDownload__i.interpolate({
            imageUrl: image.imageUrl,
            appTitle: app.title,
          }),
        ),
      );
    }
  }

  preloadImage(image: ImageContent) {
    if (
      image &&
      (image.loadStatus === "notStarted" || image.loadStatus === "failed")
    ) {
      this.loadIntoImage(image);
    }
  }

  private async chooseFolder(title: string): Promise<string | undefined> {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title,
    });
    // A cancelled dialog used to fall through and report a path error.
    return result.canceled || !result.filePaths?.length
      ? undefined
      : result.filePaths[0];
  }

  async exportSelection() {
    const folder = await this.chooseFolder(
      "Choose selections folder save location.",
    );
    if (folder) {
      await this.engine.exportSelection(folder);
    }
  }

  async importSelection() {
    const folder = await this.chooseFolder(
      "Choose selections folder location.",
    );
    if (folder) {
      await this.engine.importSelection(folder);
    }
  }
}
