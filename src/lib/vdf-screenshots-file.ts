import { VDF_ScreenshotsData } from "../models";
import { xRequest } from './x-request';
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import * as genericParser from '@node-steam/vdf';
import * as file from './helpers/file';
import * as ids from './helpers/steam';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

const mimeTypes = require('mime-types');
const toBuffer = require('blob-to-buffer');

export class VDF_ScreenshotsFile {
  private static xRequest = new xRequest();
  private fileData: any = undefined;
  private topKey: string = undefined;
  private extraneousAppIds: string[] = [];

  constructor(private filepath: string, private gridDirectory: string) { }

  private get lang() {
    return APP.lang.vdfFile;
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
      r.push(e, ids.shortenAppId(e), ids.shortenAppId(e).concat('p'),ids.shortenAppId(e).concat('_hero'),ids.shortenAppId(e).concat('_logo'),ids.shortenAppId(e).concat('_icon'));
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

  write() {
    return Promise.resolve().then(() => {
      let promises: Promise<VDF_Error>[] = [];
      let screenshotsData: VDF_ScreenshotsData = this.data;
      for (let j=0; j < this.extraneous.length; j++) {
        let exAppId = this.extraneous[j]
        promises.push(glob(`${exAppId}.*`, { dot: true, cwd: this.gridDirectory, absolute: true }).then((files: string[]) => {
          let errors: Error[] = [];
          for (let i = 0; i < files.length; i++) {
            try {
              fs.removeSync(files[i]);
            }
            catch (error) {
              errors.push(error);
            }
          }
          return errors;
        }).then((errors: Error[]) => {
          if (errors.length > 0)
            return new VDF_Error(errors);
        }));
      }
      for (const appId in screenshotsData) {
        if (screenshotsData[appId] === undefined) {
          promises.push(glob(`${appId}.*`, { dot: true, cwd: this.gridDirectory, absolute: true }).then((files: string[]) => {
            let errors: Error[] = [];
            for (let i = 0; i < files.length; i++) {
              try {
                fs.removeSync(files[i]);
              }
              catch(error) {
                errors.push(error);
              }
            }
            return errors;
          }).then((errors: Error[]) => {
            if (errors.length > 0)
              return new VDF_Error(errors);
          }));
        }
        else if (typeof screenshotsData[appId] !== 'string') {
          let data = screenshotsData[appId] as { title: string, url: string };
          promises.push(Promise.resolve().then(() => {
            return VDF_ScreenshotsFile.xRequest.request(
              data.url,
              {
                headers: { 'Content-type': 'image' },
                responseType: 'blob',
                method: 'GET',
                timeout: 1000
              }
            ).then((blob: Blob) => {
              let ext: string = data.url.split('.').slice(-1)[0];
              if (ext === "")
                return this.lang.error.unsupportedMimeType__i.interpolate({ type: blob.type, title: data.title });
              else {
                return new Promise<Buffer>((resolve, reject) => {
                  toBuffer(blob, (error: Error, buffer: Buffer) => {
                    if (error)
                      reject(this.lang.error.imageError__i.interpolate({ error, url: data.url, title: data.title }));
                    else
                      resolve(buffer);
                  });
                }).then((buffer) => {
                  return fs.outputFile(path.join(this.gridDirectory, `${appId}.${ids.map_ext[""+ext]||ext}`), buffer).then(() => {
                    screenshotsData[appId] = data.title;
                    glob(`${appId}.!(json)`, { dot: true, cwd: this.gridDirectory, absolute: true }).then((files: string[]) => {
                      let errors: Error[] = [];
                      for (let i = 0; i < files.length; i++) {
                        if(_.last(files[i].split('.'))!==(ids.map_ext[""+ext]||ext)) {
                          try {
                            fs.removeSync(files[i]);
                          }
                          catch (error) {
                            errors.push(error);
                          }
                        }
                      }
                    })
                  }).catch((error) => {
                    return this.lang.error.imageError__i.interpolate({ error, url: data.url, title: data.title });
                  })
                }).then((error: string) => {
                  return error;
                }).catch((error: any) => {
                  return new VDF_Error(error);
                })
              }
            }).catch((error) => {
              return new VDF_Error(error);
            }).then((error) => {
              if (error !== undefined)
                return new VDF_Error(error);
            })
          }));
        }
      }

      return Promise.all(promises).then((errors) => {
        this.fileData[this.topKey]['shortcutnames'] = _.pickBy(this.fileData[this.topKey]['shortcutnames'], item => item !== undefined);
        let tempData = _.cloneDeep(this.fileData);
        let tempDataNames = tempData[this.topKey]['shortcutnames']
        Object.keys(tempDataNames).forEach((key: string) =>{
        let val = tempDataNames[key];
        if(val){
          tempData[this.topKey]['shortcutnames'][key] = this.sanitizeTitle(val);
        }
        });
        let data = genericParser.stringify(tempData);
        return fs.outputFile(this.filepath, data).then(() => errors);
      }).then((errors) => {
        if (errors.length > 0) {
          let error = new VDF_Error(errors);
          if (error.valid)
            return error;
        }
      }).catch((error) => {
        throw new VDF_Error(this.lang.error.writingVdf__i.interpolate({
          filePath: this.filepath,
          error: error
        }));
      });
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
      this.fileData[this.topKey]['shortcutnames'][data.appId] = { title: data.title, url: data.url };
    }
  }
}
