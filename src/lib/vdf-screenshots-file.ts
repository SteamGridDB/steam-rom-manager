import { VDF_ScreenshotsData, VDF_ScreenshotItem, xRequestOptions } from "../models";
import { artworkTypes, artworkIdDict } from "./artwork-types";
import { xRequest } from './x-request';
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as genericParser from '@node-steam/vdf';
import * as file from './helpers/file';
import * as ids from './helpers/steam';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';
import { BehaviorSubject } from 'rxjs'
import { glob } from 'glob';

const mimeTypes = require('mime-types');
const toBuffer = require('blob-to-buffer');

export class VDF_ScreenshotsFile {
  private static xRequest = new xRequest();
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

  private removeExtraneous(exAppId: string): Promise<VDF_Error|void> {
    return glob(`${exAppId}.*`, { dot: true, cwd: this.gridDirectory, absolute: true })
    .then((files: string[]) => {
      let errors: Error[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          fs.removeSync(files[i]);
        }
        catch (error) {
          errors.push(error);
        }
      }
      if( errors.length ) {
        return new VDF_Error(errors)
      }
    })
  }

  async write(batch: boolean) {
    let addErrors: VDF_Error[] = [];
    let extraneousPromises: Promise<VDF_Error|void>[] = [];
    let screenshotsData: VDF_ScreenshotsData = this.data;
    for (let j=0; j < this.extraneous.length; j++) {
      extraneousPromises.push(this.removeExtraneous(this.extraneous[j]))
    }
    for(const appId in screenshotsData) {
      if(screenshotsData[appId] === undefined) {
        extraneousPromises.push(this.removeExtraneous(appId));
      }
    }
    const batchSize = 500;
    const delay = 5000;
    const timeout = 15000;

    const addableAppIds = Object.keys(screenshotsData).filter((appId)=>{
      return screenshotsData[appId] !== undefined && (typeof screenshotsData[appId] !== 'string')
    });
    let successes: {[appId: string]: string} = {};
    const nbatches: number = Math.ceil(addableAppIds.length / batchSize);
    for (let b = 0; b < nbatches; b++ ) {
      if(batch) {
        if(b>0){
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.batchProgress.next({batch: b, total: nbatches});
      }
      let batchAddPromises: Promise<VDF_Error>[] = [];
      for(let j= b*batchSize; j < Math.min((b+1)*batchSize,addableAppIds.length); j++) {
        const appId = addableAppIds[j];
        const data = screenshotsData[appId] as VDF_ScreenshotItem;
        const nintendoSucks = data.url.slice(-1) == '?' //DMCA Check
        let ext: string = data.url.split('.').slice(-1)[0].replace(/[^\w\s]*$/gi, "");
        ext = ids.map_ext["" + ext] || ext;
        batchAddPromises.push(VDF_ScreenshotsFile.xRequest.request(
          data.url,
          {
            headers: { 'Content-type': 'image' },
            responseType: 'blob',
            method: 'GET',
            timeout: timeout
        })
        .catch((error: any)=>{
          if(typeof error == 'object' && error.error) {
            if(error.error.status == 0 ) {
              throw `Request timed out for url:\n${data.url}`
            } else {
              throw `Requested errored with status ${error.error.status} for url:\n${data.url}`
            }
          } else {
            throw `Unknown request error for url ${data.url}:\n${error}`
          }
        })
        .then((blob: Blob) => {
          if (ext === "") {
            throw this.lang.error.unsupportedMimeType__i.interpolate({ type: blob.type, title: data.title });
          } else if (nintendoSucks) {
            throw this.lang.error.skippingDMCA__i.interpolate({ title: data.title })
          }
          return blob;
        }).then((blob: Blob)=>{
          return new Promise<Buffer>((resolve, reject) => {
            toBuffer(blob, (error: Error, buffer: Buffer) => {
              if (error)
                reject(this.lang.error.imageError__i.interpolate({ error, url: data.url, title: data.title }));
              else
                resolve(buffer);
            });
          })
        })
        .then((buffer) => {
          const gridPath = path.join(this.gridDirectory, `${appId}.${ext}`);
          fs.outputFileSync(gridPath, buffer);
          if(/^\d+$/.test(appId)) {
            const symPath = path.join(this.gridDirectory,`${ids.lengthenAppId(appId)}.${ext}`)
            if(fs.existsSync(symPath)) {
              fs.unlinkSync(symPath);
            }
            fs.symlinkSync(gridPath, symPath)
          }
          return gridPath;
        })
        .then((gridPath: string)=>{
          successes[appId] = gridPath;
        })
        .then(() => {
          return glob(`${appId}.!(json)`, { dot: true, cwd: this.gridDirectory, absolute: true })
        })
        .then((files: string[]) => {
          let errors: Error[] = [];
          for (let i = 0; i < files.length; i++) {
            if(_.last(files[i].split('.')) !== ext) {
              try {
                fs.removeSync(files[i]);
              }
              catch (error) {
                errors.push(error);
              }
            }
          }
          return new VDF_Error(errors);
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
      let batchErrors: VDF_Error[] = await Promise.all(batchAddPromises);
      addErrors = [...addErrors, ...batchErrors];
    }
    return Promise.all(extraneousPromises).then((extraneousErrors)=>{
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

  addItem(data: { appId: string, title: string, url: string }) {
    if(this.valid) {
      this.fileData[this.topKey]['shortcutnames'][data.appId] = {
        title: data.title,
        url: data.url
      };
    }
  }
}
