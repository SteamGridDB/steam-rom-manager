import { ValidatorModifier, userAccountData } from "../models";
import * as crc from 'crc';
import * as long from 'long';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as glob from 'glob';
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
                let vdfParser = require('vdf');
                fs.readFile(path.join(steamDirectory, 'config', 'loginusers.vdf'), 'utf8', (err, data) => {
                    try {
                        if (err && err.code !== 'ENOENT')
                            reject(err);
                        else {
                            if (data) {
                                let parsedData = vdfParser.parse(data);
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
                glob('userdata/+([0-9])/', { silent: true, cwd: steamDirectory }, (err, files) => {
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
}