import { ValidatorModifier, userAccountData, PreviewData, VDF_ListData, SteamTree, ParsedUserConfiguration, VDF_ShortcutsItem } from "../models";
import { VDF_AddedItemsFile } from "./vdf-added-items-file";
import { VDF_ScreenshotsFile } from "./vdf-screenshots-file";
import { VDF_ShortcutsFile } from "./vdf-shortcuts-file";
import { VDF_Manager } from "./vdf-manager";
import { APP } from "../variables";
import * as genericParser from '@node-steam/vdf';
import * as paths from "../paths";
import * as crc from 'crc';
import * as long from 'long';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as Glob from 'glob';
import * as Ajv from "ajv";
import * as _ from "lodash";
import * as nodeUrl from 'url';
const stripBom: (input: string) => string = require('strip-bom');

export namespace url {
    export function encodeFile(value: string) {
        return encodeURI(`file:///${value.replace(/\\/g, '/')}`).replace(/#/g, '%23');
    }
}

export namespace json {
    export function read<valueType>(filename: string, fallbackValue: valueType, segments?: string[]) {
        return new Promise<valueType>((resolve, reject) => {
            fs.readFile(filename, 'utf8', (error, data) => {
                try {
                    if (error) {
                        if (error.code === 'ENOENT')
                            resolve(fallbackValue);
                        else
                            reject(error);
                    }
                    else {
                        data = stripBom(data);
                        if (data) {
                            let parsedData = JSON.parse(data);

                            if (parsedData !== undefined) {
                                if (segments) {
                                    let segmentData = parsedData;
                                    for (let i = 0; i < segments.length; i++) {
                                        if (segmentData[segments[i]] !== undefined) {
                                            segmentData = segmentData[segments[i]];
                                        }
                                        else
                                            resolve(fallbackValue);
                                    }
                                    resolve(segmentData);
                                }
                                else
                                    resolve(parsedData);
                            }
                        }
                        else
                            resolve(fallbackValue);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    export function write(filename: string, value: any, segments?: string[]) {
        return Promise.resolve().then(() => {
            if (segments !== undefined)
                return read(filename, {});
            else
                return {};
        }).then((readData) => {
            if (segments !== undefined) {
                let segmentLadder = readData;
                for (let i = 0; i < segments.length - 1; i++) {
                    if (segmentLadder[segments[i]] === undefined) {
                        segmentLadder[segments[i]] = {};
                    }
                    segmentLadder = segmentLadder[segments[i]];
                }
                segmentLadder[segments[segments.length - 1]] = value;
            }
            else
                readData = value;


            return new Promise<void>((resolve, reject) => {
                fs.outputFile(filename, JSON.stringify(readData, null, 4), (error) => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            });
        });
    }

    export class Validator<T = any> {
        private static ajv = new Ajv({ removeAdditional: 'all', useDefaults: true });
        private validationFn: Ajv.ValidateFunction;
        private modifier: ValidatorModifier<T>;

        constructor(schema?: any, modifier?: ValidatorModifier<T>) {
            this.setSchema(schema);

            if (modifier !== undefined)
                this.setModifier(modifier);
        }

        setSchema(schema: any) {
            if (schema != undefined)
                this.validationFn = Validator.ajv.compile(schema);
            else
                this.validationFn = undefined;
        }

        setModifier(modifier: ValidatorModifier<T>) {
            this.modifier = modifier;
        }

        validate(data: any) {
            if (this.modifier) {
                while (this.modify(data));
                _.set(data, this.modifier.controlProperty, this.modifier.latestVersion);
            }

            if (this.validationFn) {
                this.validationFn(data);
            }
        }

        get errors() {
            if (this.validationFn) {
                return this.validationFn.errors;
            }
            else
                return [];
        }

        getDefaultValues() {
            let data = {};
            if (this.validationFn) {
                this.validationFn(data);
                if (this.modifier) {
                    _.set(data, this.modifier.controlProperty, this.modifier.latestVersion);
                }
            }
            return data;
        }

        private modify(data: any) {
            let controlValue = _.get(data, this.modifier.controlProperty, undefined);
            let modifierFieldSet = this.modifier.fields[controlValue];

            if (modifierFieldSet !== undefined) {
                for (let key in modifierFieldSet) {
                    let fieldData = modifierFieldSet[key];

                    if (fieldData.method)
                        _.set(data, key, fieldData.method(_.get(data, typeof fieldData.oldValuePath === 'string' ? fieldData.oldValuePath : key, undefined), data));
                    else if (typeof fieldData.oldValuePath === 'string')
                        _.set(data, key, _.get(data, fieldData.oldValuePath, undefined));
                }
                return !_.isEqual(controlValue, _.get(data, this.modifier.controlProperty, undefined));
            }
            else
                return false;
        }
    }
}

export namespace steam {
    export function getAvailableLogins(steamDirectory: string, useCredentials: boolean) {
        return new Promise<userAccountData[]>((resolve, reject) => {
            if (useCredentials) {
                fs.readFile(path.join(steamDirectory, 'config', 'loginusers.vdf'), 'utf8', (err, data) => {
                    try {
                        if (err && err.code !== 'ENOENT')
                            reject(err);
                        else {
                            if (data) {
                                let parsedData = genericParser.parse(data) as any;
                                let accountData: userAccountData[] = [];
                                if (parsedData.users) {
                                    for (let steamID64 in parsedData.users) {
                                        accountData.push({ steamID64: steamID64, accountID: steamID_64_ToAccountID(steamID64), name: parsedData.users[steamID64].AccountName });
                                    }
                                }
                                resolve(accountData);
                            }
                            else
                                resolve([]);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            else {
                Glob('userdata/+([0-9])/', { silent: true, cwd: steamDirectory }, (err, files) => {
                    if (err)
                        reject(err);
                    else {
                        let getUserId = function (filename: string) {
                            return /userdata(\\|\/)(.*?)(\\|\/)/i.exec(filename)[2];
                        }

                        let accountData: userAccountData[] = [];
                        for (let i = 0; i < files.length; i++) {
                            let userId = getUserId(files[i]);
                            accountData.push({ steamID64: 'unavailable', accountID: userId, name: userId });
                        }
                        resolve(accountData);
                    }
                });
            }
        });
    }

    export function getMultipleAvailableLogins(steamDirectories: string[], useCredentials: boolean | boolean[]) {
        let multipleDirData: { data: { [directory: string]: userAccountData[] }, numberOfAccounts: number } = { data: {}, numberOfAccounts: 0 };
        let promises: Promise<userAccountData[]>[] = [];
        let isArray = useCredentials instanceof Array;

        for (let i = 0; i < steamDirectories.length; i++) {
            promises.push(getAvailableLogins(steamDirectories[i], isArray ? (useCredentials[i] || false) : useCredentials || false));
        }

        return Promise.resolve().then(() => {
            if (promises.length > 0) {
                return promises.reduce((p, c, i) => p.then((data) => {
                    multipleDirData.data[steamDirectories[i]] = data;
                    multipleDirData.numberOfAccounts += data.length;
                    return c;
                }), Promise.resolve().then(() => promises[0]));
            }
        }).then(() => {
            return multipleDirData;
        });
    }

    export function steamID_64_ToAccountID(steamID64: string) {
        let steamID_64_Identifier = long.fromString("0110000100000000", true, 16);
        let longValue = long.fromValue(steamID64).subtract(steamID_64_Identifier);
        return longValue.toString();
    }

    export function generateAppId(executableLocation: string, title: string) {
        //From https://github.com/Hafas/node-steam-shortcuts

        let crcValue = crc.crc32(executableLocation + title);
        let longValue = new long(crcValue, crcValue, true);
        longValue = longValue.or(0x80000000);
        longValue = longValue.shl(32);
        longValue = longValue.or(0x02000000);
        return longValue.toString();
    }

    export function generateTreeFromParsedConfig(data: ParsedUserConfiguration[]) {
        let steamTree: SteamTree<any> = {
            tree: {},
            numberOfUsers: 0
        };

        for (let i = 0; i < data.length; i++) {
            let config = data[i];

            if (steamTree.tree[config.steamDirectory] === undefined)
                steamTree.tree[config.steamDirectory] = {};

            for (let j = 0; j < config.foundUserAccounts.length; j++) {
                let userAccount = config.foundUserAccounts[j];

                if (steamTree.tree[config.steamDirectory][userAccount.accountID] === undefined) {
                    steamTree.numberOfUsers++;
                    steamTree.tree[config.steamDirectory][userAccount.accountID] = {};
                }
            }
        }

        return steamTree;
    }

    export function getGridImagesForTree(tree: SteamTree<{ [appId: string]: string }>) {
        return Promise.resolve().then(() => {
            let data = _.cloneDeep(tree);

            if (data.numberOfUsers === 0)
                return data;
            else {
                let promises: Promise<void>[] = [];
                for (let steamDirectory in data.tree) {
                    for (let userId in data.tree[steamDirectory]) {
                        promises.push(
                            fs.readdir(path.join(steamDirectory, 'userdata', userId, 'config', 'grid')).then((files) => {
                                let extRegex = /png|tga|jpg|jpeg/i;
                                for (let i = 0; i < files.length; i++) {
                                    let ext = path.extname(files[i]);
                                    let appId = path.basename(files[i], ext);
                                    if (data.tree[steamDirectory][userId][appId] === undefined) {
                                        if (extRegex.test(ext))
                                            data.tree[steamDirectory][userId][appId] = path.join(steamDirectory, 'userdata', userId, 'config', 'grid', files[i]);
                                    }
                                }
                            }).catch((error) => {
                                if (error.code !== 'ENOENT')
                                    throw error;
                            })
                        );
                    }
                }
                return Promise.all(promises).then(() => data);
            }
        });
    }

    export function getNonSteamShortcutsData(tree: SteamTree<{ [appId: string]: VDF_ShortcutsItem }>) {
        return Promise.resolve().then(() => {
            let data = _.cloneDeep(tree);

            if (data.numberOfUsers === 0)
                return data;
            else {
                let vdfManager = new VDF_Manager();
                return Promise.resolve().then(() => {
                    return vdfManager.prepare(data.tree as any as PreviewData);
                }).then(() => {
                    return vdfManager.read({ shortcuts: true });
                }).then(() => {
                    vdfManager.forEach((steamDirectory, userId, listItem) => {
                        if (data.tree[steamDirectory] !== undefined && data.tree[steamDirectory][userId] !== undefined) {
                            let appIds = listItem.shortcuts.getAppIds();

                            data.tree[steamDirectory][userId] = {};
                            for (let i = 0; i < appIds.length; i++) {
                                data.tree[steamDirectory][userId][appIds[i]] = listItem.shortcuts.getItem(appIds[i]);
                            }
                        }
                    });
                    return data;
                })
            }
        });
    }
}

export namespace vdf {
    export function generateListFromPreviewData(previewData: PreviewData) {
        return Promise.resolve().then(() => {
            let vdfData: VDF_ListData = {};
            let numberOfGeneratedEntries: number = 0;
            for (let directory in previewData) {
                for (let user in previewData[directory]) {
                    if (vdfData[directory] === undefined)
                        vdfData[directory] = {};

                    if (vdfData[directory][user] === undefined) {
                        numberOfGeneratedEntries++;
                        vdfData[directory][user] = {
                            addedItems: new VDF_AddedItemsFile(path.join(directory, 'userdata', user, 'config', paths.savedListFilename)),
                            screenshots: new VDF_ScreenshotsFile(
                                path.join(directory, 'userdata', user, '760', 'screenshots.vdf'),
                                path.join(directory, 'userdata', user, 'config', 'grid')
                            ),
                            shortcuts: new VDF_ShortcutsFile(path.join(directory, 'userdata', user, 'config', 'shortcuts.vdf'))
                        };
                    }
                }
            }
            return { data: vdfData, numberOfGeneratedEntries, errors: [] as string[] };
        });
    }

    export function generateListFromDirectoryList(steamDirectories: string[]) {
        let retrieveMultipleVDFPaths = function (steamDirectories: string[]) {
            let userIdRegex = /userdata(?:\/|\\)(.*?)(?:\/|\\)/;
            let promises: Promise<{ data: { directory: string, users: { id: string, paths: string[] }[] }, error: string }>[] = [];
            for (let i = 0; i < steamDirectories.length; i++) {
                promises.push(new Promise<{ data: { directory: string, users: { id: string, paths: string[] }[] }, error: string }>((resolve, reject) => {
                    Glob('userdata/+([0-9])/', { silent: true, dot: true, cwd: steamDirectories[i] }, (error, folders) => {
                        if (error)
                            reject(error);
                        else if (folders.length === 0) {
                            resolve({ data: null, error: APP.lang.helpers.error.noUserIdsInDir__i.interpolate({ steamDirectory: steamDirectories[i] }) });
                        }
                        else {
                            let users: { id: string, paths: string[] }[] = [];
                            for (let j = 0; j < folders.length; j++) {
                                users.push({
                                    id: folders[j].match(userIdRegex)[1],
                                    paths: [
                                        path.join(steamDirectories[i], folders[j], 'config', paths.savedListFilename),
                                        path.join(steamDirectories[i], folders[j], '760', 'screenshots.vdf'),
                                        path.join(steamDirectories[i], folders[j], 'config', 'grid'),
                                        path.join(steamDirectories[i], folders[j], 'config', 'shortcuts.vdf')
                                    ]
                                });
                            }
                            resolve({ data: { directory: steamDirectories[i], users }, error: null });
                        }
                    });
                }));
            }
            return Promise.all(promises);
        }

        return retrieveMultipleVDFPaths(steamDirectories).then((data) => {
            let vdfData: VDF_ListData = {};
            let numberOfGeneratedEntries: number = 0;
            let errors: string[] = [];
            for (let i = 0; i < data.length; i++) {
                if (data[i].error)
                    errors.push(data[i].error);
                else {
                    let directory = data[i].data.directory;
                    let users = data[i].data.users;

                    if (vdfData[directory] === undefined)
                        vdfData[directory] = {};

                    for (let j = 0; j < users.length; j++) {
                        let user = users[j];

                        if (vdfData[directory][user.id] === undefined) {
                            numberOfGeneratedEntries++;
                            vdfData[directory][user.id] = {
                                addedItems: new VDF_AddedItemsFile(user.paths[0]),
                                screenshots: new VDF_ScreenshotsFile(
                                    path.join(user.paths[1]),
                                    path.join(user.paths[2])
                                ),
                                shortcuts: new VDF_ShortcutsFile(user.paths[3])
                            };
                        }
                    }
                }
            }

            return { data: vdfData, numberOfGeneratedEntries, errors };
        });
    }
}

export namespace glob {
    export function promise(pattern: string, options: Glob.IOptions) {
        return new Promise<string[]>((resolve, reject) => {
            try {
                Glob(pattern, options, (error, files) => {
                    if (error)
                        reject(error);
                    else
                        resolve(files);
                });
            } catch (error) {
                reject(error);
            }
        })
    }
}

export namespace file {
    export function backup(filepath: string, ext: string, overwrite: boolean = false) {
        let newFilepath = path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)));
        if (ext[0] === '.')
            newFilepath += ext;
        else
            newFilepath = `${newFilepath}.${ext}`;

        return fs.copy(filepath, newFilepath, { overwrite: overwrite }).then();
    }
}