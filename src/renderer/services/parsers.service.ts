import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { UserConfiguration, ParsedUserConfiguration } from '../models';
import { LoggerService } from './logger.service';
import { FileParser } from '../lib';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from "rxjs";
import * as fs from 'fs-extra';
import * as paths from '../../shared/paths'

@Injectable()
export class ParsersService {
    private fileParser: FileParser;
    private userConfigurations: BehaviorSubject<UserConfiguration[]>;

    constructor(private loggerService: LoggerService, private http: Http) {
        this.fileParser = new FileParser(this.http, this.loggerService);
        this.userConfigurations = new BehaviorSubject<UserConfiguration[]>([]);
        this.readUserConfigurations();
    }

    getUserConfigurations() {
        return this.userConfigurations.asObservable();
    }

    getUserConfigurationsArray() {
        return this.userConfigurations.getValue();
    }

    saveConfiguration(config: UserConfiguration) {
        let userConfigurations = this.userConfigurations.getValue();
        userConfigurations = userConfigurations.concat(config);
        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    swapIndex(currentIndex: number, newIndex: number) {
        let userConfigurations = this.userConfigurations.getValue();
        var temp = userConfigurations[currentIndex];
        userConfigurations[currentIndex] = userConfigurations[newIndex];
        userConfigurations[newIndex] = temp;
        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    updateConfiguration(config: UserConfiguration, index: number) {
        let userConfigurations = this.userConfigurations.getValue();
        userConfigurations[index] = config;
        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    deleteConfiguration(index: number) {
        let userConfigurations = this.userConfigurations.getValue();
        userConfigurations.splice(index, 1);
        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    getAvailableParsers() {
        return this.fileParser.getAvailableParsers();
    }

    getParser(parser: string) {
        return this.fileParser.getParser(parser);
    }

    executeFileParser(...configs: UserConfiguration[]) {
        let invalidConfigTitles: string[] = [];
        let skipped: string[] = [];
        let validConfigs: UserConfiguration[] = [];

        if (configs.length === 0) {
            let configArray = this.getUserConfigurationsArray();
            for (let i = 0; i < configArray.length; i++) {
                if (configArray[i].enable)
                    configs.push(configArray[i]);
                else
                    skipped.push(configArray[i].configTitle);
            }
        }

        configs = cloneDeep(configs);

        for (let i = 0; i < configs.length; i++) {
            if (this.isConfigurationValid(configs[i]))
                validConfigs.push(configs[i]);
            else
                invalidConfigTitles.push(configs[i].configTitle);
        }

        return this.fileParser.executeFileParser(validConfigs).then((parsedData) => {
            return { parsedData: parsedData, invalid: invalidConfigTitles, skipped: skipped };
        });
    }

    validateParser(parser: string) {
        let availableParsers = this.getAvailableParsers();
        if (availableParsers.indexOf(parser) !== -1)
            return null;
        else
            return 'Incorrect parser type!';
    }

    validateConfigTitle(configTitle: string) {
        if (configTitle)
            return null;
        else
            return 'Configuration title is required!';
    }

    validateSteamCategory(steamCategory: string): null {
        return null;
    }

    validateParserInput(parser: string, input: string, inputData: string) {
        let availableParser = this.getParser(parser);
        if (availableParser) {
            if (availableParser.inputs === undefined)
                return 'No inputs are available!';
            else if (availableParser.inputs[input] === undefined)
                return `"${input}" input is not available!`;
            else if (availableParser.inputs[input].forcedInput || availableParser.inputs[input].validationFn === undefined)
                return null;
            else
                return availableParser.inputs[input].validationFn(inputData);
        }
        else
            return 'Incorrect parser!';
    }

    validateROMsDir(romDirectory: string) {
        if (this.validatePath(romDirectory, true))
            return null;
        else
            return 'ROMs directory is invalid!';
    }

    validateSteamDir(steamDirectory: string) {
        if (this.validatePath(steamDirectory, true))
            return null;
        else
            return 'Steam directory is invalid!';
    }

    validateExecutableLocation(executableLocation: string) {
        if (this.validatePath(executableLocation, false))
            return null;
        else
            return 'Executable file is invalid!';
    }

    validateExecutableArgs(executableArgs: string): null {
        return null;
    }

    validateLocalImages(localImages: string): null {
        return null;
    }

    validateTitlePrefix(titlePrefix: string): null {
        return null;
    }

    validateTitleSuffix(titleSuffix: string): null {
        return null;
    }

    private validatePath(fsPath: string, checkForDirectory: boolean) {
        try {
            let path = fs.statSync(fsPath);
            return checkForDirectory ? path.isDirectory() : path.isFile();
        } catch (e) {
            return false;
        }
    }

    private isConfigurationValid(config: UserConfiguration) {
        if (this.validateParser(config.parserType || '') !== null)
            return false;
        else if (this.validateConfigTitle(config.configTitle || '') !== null)
            return false;
        else if (this.validateSteamCategory(config.steamCategory || '') !== null)
            return false;
        else if (this.validateROMsDir(config.romDirectory || '') !== null)
            return false;
        else if (this.validateSteamDir(config.steamDirectory || '') !== null)
            return false;
        else if (this.validateExecutableLocation(config.executableLocation || '') !== null)
            return false;
        else if (this.validateExecutableArgs(config.executableArgs || '') !== null)
            return false;
        else if (this.validateTitlePrefix(config.titlePrefix || '') !== null)
            return false;
        else if (this.validateTitleSuffix(config.titleSuffix || '') !== null)
            return false;
        else {
            let availableParser = this.getParser(config.parserType);
            if (availableParser.inputs !== undefined) {
                let parserInputs = config.parserInputs || {};
                for (let inputName in availableParser.inputs) {
                    if (this.validateParserInput(config.parserType, inputName, parserInputs[inputName]) !== null)
                        return false;
                }
            }
        }
        return true;
    }

    private saveUserConfigurations() {
        return new Promise<UserConfiguration[]>((resolve, reject) => {
            fs.outputFile(paths.userConfigurations, JSON.stringify(this.userConfigurations.getValue(), null, 4), (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        }).then().catch((error) => {
            this.loggerService.error('Error encountered while saving user configurations!', { invokeAlert: true, alertTimeout: 5000 });
            this.loggerService.error(error.message);
        });
    }

    private readUserConfigurations() {
        return new Promise<UserConfiguration[]>((resolve, reject) => {
            fs.readFile(paths.userConfigurations, 'utf8', (error, data) => {
                try {
                    if (error) {
                        if (error.code === 'ENOENT')
                            resolve([]);
                        else
                            reject(error);
                    }
                    else
                        resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).then((data) => {
            this.userConfigurations.next(data);
        }).catch((error) => {
            this.loggerService.error('Error encountered while reading user configurations!', { invokeAlert: true, alertTimeout: 5000 });
            this.loggerService.error(error);
        });
    }
}