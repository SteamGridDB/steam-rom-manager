import { VDF_ScreenshotsData } from "../models";
import { xRequest } from './x-request';
import { VDF_Error } from './vdf-error';
import { APP } from '../variables';
import { Bluebird } from './zone-bluebird';
import * as genericParser from '@node-steam/vdf';
import * as glob from './helpers/glob';
import * as file from './helpers/file';
import * as ids from './helpers/steam';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';

const mimeTypes = require('mime-types');
const toBuffer = require('blob-to-buffer');

export class VDF_ScreenshotsFile {
  private static xRequest = new xRequest(Bluebird);
  private fileData: any = undefined;
  private extraneousAppIds: string[] = [];

  constructor(private filepath: string, private gridDirectory: string) { }

  private get lang() {
    return APP.lang.vdfFile;
  }

  get data(): VDF_ScreenshotsData {
    if (this.fileData === undefined)
      return undefined;
    else
      return this.fileData['Screenshots']['shortcutnames'];
  }

  set data(value: VDF_ScreenshotsData) {
    if (this.fileData === undefined)
      return;
    else
      this.fileData['Screenshots']['shortcutnames'] = value;
  }

  set extraneous(value: string[]) {
    this.extraneousAppIds = value.reduce((r, e)=>{
      r.push(e, ids.shortenAppId(e), ids.shortenAppId(e).concat('p'),ids.shortenAppId(e).concat('_hero'),ids.shortenAppId(e).concat('_logo'));
      return r;
    }, []);
  }
  get extraneous() {
    return this.extraneousAppIds;
  }

  get valid() {
    return this.fileData !== undefined;
  }

  get invalid() {
    return !this.valid;
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
      if (data)
        this.fileData = genericParser.parse(data);
      else
        this.fileData = {};

      if (this.fileData['Screenshots'] === undefined)
        this.fileData['Screenshots'] = { 'shortcutnames': {} };
      else if (this.fileData['Screenshots']['shortcutnames'] === undefined)
        this.fileData['Screenshots']['shortcutnames'] = {};

      return this.data;
    });
  }

  write() {
    return Promise.resolve().then(() => {
      let promises: Promise<VDF_Error>[] = [];
      let screenshotsData: VDF_ScreenshotsData = this.data;
      for (let j=0; j < this.extraneous.length; j++) {
        let exAppId = this.extraneous[j]
        promises.push(glob.promise(`${exAppId}.*`, { silent: true, dot: true, cwd: this.gridDirectory, absolute: true }).then((files) => {
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
        }).then((errors) => {
          if (errors.length > 0)
            return new VDF_Error(errors);
        }));
      }
      for (const appId in screenshotsData) {
        if (screenshotsData[appId] === undefined) {
          promises.push(glob.promise(`${appId}.*`, { silent: true, dot: true, cwd: this.gridDirectory, absolute: true }).then((files) => {
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
          }).then((errors) => {
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
              let ext: string = data.url.split('.').slice(-1)[0];//mimeTypes.extension(blob.type);
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
                    glob.promise(`${appId}.!(json)`, { silent: true, dot: true, cwd: this.gridDirectory, absolute: true }).then((files) => {
                      let errors: Error[] = [];
                      for (let i = 0; i < files.length; i++) {
                        if(files[i].split('.')[1]!==(ids.map_ext[""+ext]||ext)) {
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

      // Limit promise concurrency to 100
      return Bluebird.map(promises, promise => promise, { concurrency: 100 }).then((errors) => {
        this.fileData['Screenshots']['shortcutnames'] = _.pickBy(this.fileData['Screenshots']['shortcutnames'], item => item !== undefined);
        let data = genericParser.stringify(this.fileData);
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

  addItem(data: { appId: string, title: string, url: string }) {
    this.fileData['Screenshots']['shortcutnames'][data.appId] = { title: data.title, url: data.url };
  }

  removeItem(appId: string) {
    this.fileData['Screenshots']['shortcutnames'][appId] = undefined;
  }
}
