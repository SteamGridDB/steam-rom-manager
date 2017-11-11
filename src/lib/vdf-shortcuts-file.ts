import { VDF_ShortcutsItem } from "../models";
import { VDF_Error } from './vdf-error';
import { steam, file } from './helpers';
import { APP } from '../variables';
import * as _ from "lodash";
import * as fs from 'fs-extra';
import * as path from 'path';

const shortcutsParser = require('steam-shortcut-editor');

export class VDF_ShortcutsFile {
    private fileData: any = undefined;
    private indexMap: { [appId: string]: number } = undefined;

    constructor(private filepath: string) { }

    private get lang() {
        return APP.lang.vdfFile;
    }

    get data(): VDF_ShortcutsItem[] {
        if (this.fileData === undefined)
            return undefined;
        else
            return this.fileData['shortcuts'];
    }

    set data(value: VDF_ShortcutsItem[]) {
        if (this.fileData === undefined)
            return;
        else
            this.fileData['shortcuts'] = value;
    }

    get valid() {
        return this.fileData !== undefined;
    }

    get invalid() {
        return !this.valid;
    }

    read() {
        return fs.readFile(this.filepath).catch((error) => {
            if (error.code !== 'ENOENT') {
                throw new VDF_Error(APP.lang.vdfFile.error.readingVdf__i.interpolate({
                    filePath: this.filepath,
                    error: error
                }));
            }
        }).then((data) => {
            if (data)
                this.fileData = shortcutsParser.parseBuffer(data);
            else
                this.fileData = {};

            if (this.fileData['shortcuts'] === undefined)
                this.fileData['shortcuts'] = [];

            let shortcutsData = this.data;
            this.indexMap = {};

            for (let i = 0; i < shortcutsData.length; i++) {
                let shortcut = shortcutsData[i];
                this.indexMap[steam.generateAppId(shortcut.exe, shortcut.appname)] = i;
            }

            return this.data;
        });
    }

    write() {
        return Promise.resolve().then(() => {
            this.fileData['shortcuts'] = _.pickBy(this.fileData['shortcuts'], item => item !== undefined);
            let data = shortcutsParser.writeBuffer(this.fileData);
            return fs.outputFile(this.filepath, data);
        }).catch((error) => {
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

    getItem(appId: string){
        if (this.indexMap[appId] !== undefined)
            return this.fileData['shortcuts'][this.indexMap[appId]];
        else
            return undefined;
    }

    removeItem(appId: string){
        if (this.indexMap[appId] !== undefined){
            this.fileData['shortcuts'][this.indexMap[appId]] = undefined;
            this.indexMap[appId] = undefined;
        }
    }

    addItem(appId: string, value: VDF_ShortcutsItem){
        if (this.indexMap[appId] === undefined){
            this.fileData['shortcuts'].push(value);
            this.indexMap[appId] = this.fileData['shortcuts'].length - 1;
        }
    }

    getAppIds(){
        return Object.keys(this.indexMap);
    }
}