import { ArtworkCacheData } from "../models";
import { APP } from '../variables';
import * as json from './helpers/json';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';
import * as paths from '../paths';

export class ArtworkCache {
  private artworkCache: ArtworkCacheData = undefined;
  private filePath: string = path.join(paths.userDataDir,'artworkCache.json')

  constructor() { }

  get sgdbToArt() {
    return (this.artworkCache||{}).sgdbToArt;
  }

  read() {
    const modifierLatest = 0;
    const modifier: {[controlVersion: string]: { method: (readData: any)=> any}} = {}
    return json.read<any>(this.filePath, {
        version: 0,
        sgdbToArt: {}
    }).then((readData) => {
      let controlVersion;
      if(!readData.version) {
        controlVersion = 0;
      } else {
        controlVersion = readData.version
      }
      let result = _.cloneDeep(readData);
      for(let j = controlVersion; j < modifierLatest; j++) {
        result = modifier[j.toString() as keyof typeof modifier].method(result);
      }
      this.artworkCache = result;
      return this.sgdbToArt;
    }).catch((error) => {
      this.artworkCache = {version: modifierLatest, sgdbToArt: {}};
    });
  }

  write() {
    return json.write(this.filePath, this.artworkCache);
  }

  async emptyCache() {
    this.artworkCache.sgdbToArt = {};
    await this.write();
  }

  cacheArtwork(sgdbId: string, artworkId: string, appId: string, artworkType: string) {
    this.artworkCache.sgdbToArt[artworkType] ||= {};
    this.artworkCache.sgdbToArt[artworkType][sgdbId] = {
      artworkId: artworkId,
      appId: appId
    };
  }
}