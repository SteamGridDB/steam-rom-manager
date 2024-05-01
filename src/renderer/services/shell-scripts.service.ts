import { Injectable } from '@angular/core';
import { xRequestOptions } from "../../models";
import { LoggerService } from './logger.service';
import { BehaviorSubject } from "rxjs";
import { xRequest } from '../../lib/x-request';
import * as paths from "../../paths";
import * as _ from "lodash";
import * as path from "path"
import * as fs from 'fs';
import * as os from 'os';

@Injectable()
export class ShellScriptsService {
  private xRequest = new xRequest();
  private requestOpts: xRequestOptions = {
    method: 'GET',
    timeout: 5000
  }
  private downloadStatus: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private downloadFinished: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private rawURL: string = 'https://raw.githubusercontent.com/SteamGridDB/steam-rom-manager/master/';
  private treesURL: string = 'https://api.github.com/repos/SteamGridDB/steam-rom-manager/git/trees/';

  constructor(private loggerService: LoggerService) {
    if(os.type()=='Windows_NT') {
      this.download();
    }
  }

  async download(force: boolean = false) {
    if(!this.downloadStatus.getValue()) {
      this.downloadStatus.next(true);
      const downloadURL = this.treesURL.concat('master').concat('?recursive=1')
      const treeData = await this.xRequest.request(downloadURL, {...this.requestOpts, responseType: 'json'})
      let scriptURLs = treeData.tree
      .filter((entry: any)=>path.dirname(entry.path)=='files/shellscripts')
      .map((entry: any)=>entry.path)
      let scripts: any[] = []
      const scriptsDir = path.join(paths.userDataDir,'scripts')
      if(!fs.existsSync(scriptsDir)) {
        fs.mkdirSync(scriptsDir)
      }
      for(let scriptURL of scriptURLs) {
        const cleanURL = scriptURL.split('/').map((x:string)=>encodeURI(x)).join('/');
        const fullURL = this.rawURL.concat(cleanURL)
        const script = await this.xRequest.request(fullURL, {...this.requestOpts, responseType: 'text'});
        const localScriptPath = path.join(scriptsDir,path.basename(scriptURL))
        fs.writeFileSync(localScriptPath, script)
      }
      this.loggerService.info('Shell scripts have been updated.')
      this.downloadStatus.next(false);
      this.downloadFinished.next(true);
    }
  }
}
