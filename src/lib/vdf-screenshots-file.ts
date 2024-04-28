import { VDF_ScreenshotsData, VDF_ScreenshotItem } from "../models";
import { artworkTypes, artworkIdDict } from "./artwork-types";
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as genericParser from '@node-steam/vdf';
import * as file from './helpers/file';
import * as ids from './helpers/steam';
import { ImageDownloader } from "./helpers/url";

import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';
import { BehaviorSubject } from 'rxjs'
import { glob } from 'glob';
import * as paths from '../paths';

export class VDF_ScreenshotsFile {
  private fileData: any = undefined;
  private topKey: string = undefined;
  private extraneousAppIds: string[] = [];
  private batchProgress: BehaviorSubject<{batch: number, total: number}>

  constructor(private filepath: string, private gridDirectory: string) {
    this.batchProgress = new BehaviorSubject<{batch: number, total: number}>({batch: -1, total: undefined});
  }

  private get lang() {
    return APP.lang.vdfFile;
  }

  getBatchProgress() {
    return this.batchProgress.asObservable();
  }

  get gridDir() {
    return this.gridDirectory
  }

  get data(): VDF_ScreenshotsData {
    if(this.valid) {
      return this.fileData[this.topKey]['shortcutnames'];
    }
  }

  set data(value: VDF_ScreenshotsData) {
    if(this.valid) {
      this.fileData[this.topKey]['shortcutnames'] = value;
    }
  }

  set extraneous(value: string[]) {
    this.extraneousAppIds = value.reduce((r, e)=>{
      r.push(e);
      for(const artworkType of artworkTypes) {
        r.push(ids.shortenAppId(e).concat(artworkIdDict[artworkType]));
      }
      return r;
    }, []);
  }

  get extraneous() {
    return this.extraneousAppIds;
  }

  get invalid() {
    return this.fileData == undefined || this.fileData[this.topKey] == undefined || this.fileData[this.topKey]['shortcutnames'] == undefined;
  }

  get valid() {
    return !this.invalid;
  }


  sanitizeTitle(title: string) {
    return (title || "").replace(/\\/g,"\\\\").replace(/\"/g,"\\\"");
  }
  desanitizeTitle(title: string) {
    return (title || "").replace(/\\\"/g,"\"").replace(/\\\\/g,"\\");
  }

  read() {
    return fs.readFile(this.filepath, 'utf8').catch((error) => {
      if (error.code !== 'ENOENT') {
        throw new VDF_Error(APP.lang.vdfFile.error.readingVdf__i.interpolate({
          filePath: this.filepath,
          error: error
        }));
      }
    }).then((data) => {
      this.fileData = !!data ? genericParser.parse(data) || {} : {};
      if(!!this.fileData['screenshots']) {
        this.topKey='screenshots'
      } else {
        this.topKey='Screenshots'
      }
      if (this.fileData[this.topKey] === undefined)
        this.fileData[this.topKey] = {};
      if (this.fileData[this.topKey]['shortcutnames'] === undefined)
        this.fileData[this.topKey]['shortcutnames'] = {};

      Object.keys(this.data).forEach((key: string) =>{
        let val = this.data[key];
        if(val){
          this.fileData[this.topKey]['shortcutnames'][key] = this.desanitizeTitle(val.toString());
        }
      });
      return this.data;
    });
  }

  async removeExtraneous(exAppIds: string[]): Promise<VDF_Error[]> {
    let vdfErrors: VDF_Error[] = [];
    for(let exAppId of exAppIds) {
      let errors: Error[] = [];
      const files = await glob(`${exAppId}.*`, {cwd: this.gridDirectory, absolute: true});
      for (let i = 0; i < files.length; i++) {
        try {
          await fs.remove(files[i]);
        }
        catch (error) {
          errors.push(error);
        }
      }
      if(errors.length) {
        vdfErrors.push(new VDF_Error(errors))
      }
    }
    return vdfErrors;
  }

  async write(batch: boolean, batchSizeInput?: number) {
    let addErrors: (VDF_Error|void)[] = [];
    let screenshotsData: VDF_ScreenshotsData = this.data;
    const extraneous = [...this.extraneous, ...Object.keys(screenshotsData).filter(appId=> !screenshotsData[appId])];
    const batchSize = batchSizeInput || 50;
    const imageDownloader: ImageDownloader = new ImageDownloader();
    const addableAppIds = Object.keys(screenshotsData).filter((appId)=>{
      return screenshotsData[appId] !== undefined && (typeof screenshotsData[appId] !== 'string')
    });
    let successes: {[appId: string]: string} = {};
    const nbatches: number = Math.ceil(addableAppIds.length / batchSize);
    for (let b = 0; b < nbatches; b++ ) {
      if(batch) {
        this.batchProgress.next({batch: b, total: nbatches});
      }
      let batchAddPromises: Promise<VDF_Error|void>[] = [];
      for(let j= b*batchSize; j < Math.min((b+1)*batchSize,addableAppIds.length); j++) {
        const appId = addableAppIds[j];
        const data = screenshotsData[appId] as VDF_ScreenshotItem;
        const nintendoSucks = data.url.slice(-1) == '?' //DMCA Check
        if(!nintendoSucks) {
          let ext: string = data.url.split('.').slice(-1)[0].replace(/[^\w\s]*$/gi, "");
          ext = ids.map_ext["" + ext] || ext;
          const gridPath = path.join(this.gridDirectory, `${appId}.${ext}`);
          let secondaryPath: string;
          if(data.sgdbId && data.drmProtect) {
            secondaryPath = path.join(paths.userDataDir,'artworkBackups',data.artworkType,`${data.sgdbId}.${ext}`);
          }
          batchAddPromises.push(imageDownloader.downloadAndSaveImage(data.url, gridPath, 4, secondaryPath)
          .then(async () => {
            if(/^\d+$/.test(appId)) {
              const symPath = path.join(this.gridDirectory,`${ids.lengthenAppId(appId)}.${ext}`)
              if(await fs.exists(symPath)) {
                await fs.unlink(symPath);
              }
              await fs.symlink(gridPath, symPath)
            }
            return gridPath;
          })
          .then((gridPath: string)=>{
            successes[appId] = gridPath;
          })
          .then(() => {
            return glob(`${appId}.!(json)`, { dot: true, cwd: this.gridDirectory, absolute: true })
          })
          .then(async (files: string[]) => {
            for (let i = 0; i < files.length; i++) {
              if(_.last(files[i].split('.')) !== ext) {
                await fs.remove(files[i]);
              }
            }
          })
          .then(()=>{
            if(secondaryPath) {
              return glob(`${data.sgdbId}.*`, { dot: true, cwd: path.join(paths.userDataDir,'artworkBackups', data.artworkType), absolute: true}).then(async (files: string[])=>{
                for (let i = 0; i < files.length; i++) {
                  if(_.last(files[i].split('.')) !== ext) {
                    await fs.remove(files[i]);
                  }
                }
              })
            }
          })
          .catch((error) => {
            if(error) {
              return new VDF_Error(`Error for title ${data.title}:\n${error}`);
            }
          })
          .finally(()=>{
            screenshotsData[appId] = data.title;
          }))
        }
      }
      const batchErrors = await Promise.all(batchAddPromises);
      addErrors = [...addErrors, ...batchErrors];
    }


    return this.removeExtraneous(extraneous).then((extraneousErrors)=>{
      return {
        extraneousErrors: extraneousErrors.filter(e=> e && e.message),
        addErrors: addErrors.filter(e => e && e.message)
      }
    })
    .then(({extraneousErrors, addErrors}: {extraneousErrors: VDF_Error[], addErrors: VDF_Error[]}) => {
      this.fileData[this.topKey]['shortcutnames'] = _.pickBy(this.fileData[this.topKey]['shortcutnames'], item => item !== undefined);
      let tempData = _.cloneDeep(this.fileData);
      let tempDataNames = tempData[this.topKey]['shortcutnames']
      Object.keys(tempDataNames).forEach((key: string) =>{
        let val = typeof tempDataNames[key] == 'string' ? tempDataNames[key] : tempDataNames[key].title;
        if(val){
          tempData[this.topKey]['shortcutnames'][key] = this.sanitizeTitle(val);
        }
      });
      let data = genericParser.stringify(tempData);
      fs.outputFileSync(this.filepath, data);
      return extraneousErrors.concat(addErrors);
    }).then((errors: VDF_Error[]) => {
      // Handle non-fatal errors
      let error: VDF_Error = undefined;
      if (errors.length > 0) {
        error = new VDF_Error(errors);
      }
      return {successes: successes, error:  error && error.valid ? error : undefined}
    }).catch((error) => {
      // Handle fatal errors
      throw new VDF_Error(this.lang.error.writingVdf__i.interpolate({
        filePath: this.filepath,
        error: error
      }));
    });
  }

  backup(ext: string, overwrite: boolean = false) {
    return file.backup(this.filepath, ext, overwrite).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw new VDF_Error(this.lang.error.creatingBackup__i.interpolate({
          filePath: this.filepath,
          error: error
        }));
      }
    });
  }

  getItem(appId: string) {
    if(this.valid) {
      return this.fileData[this.topKey]['shortcutnames'][appId];
    }
  }

  removeItem(appId: string) {
    if(this.valid) {
      this.fileData[this.topKey]['shortcutnames'][appId] = undefined;
    }
  }

  addItem(data: VDF_ScreenshotItem & {appId: string}) {
    if(this.valid) {
      this.fileData[this.topKey]['shortcutnames'][data.appId] = {
        title: data.title,
        url: data.url,
        artworkType: data.artworkType,
        sgdbId: data.sgdbId,
        drmProtect: data.drmProtect
      };
    }
  }
}
