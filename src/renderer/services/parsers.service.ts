import { JsonValidator } from '../../shared/lib/json-helpers';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { UserConfiguration, ParsedUserConfiguration } from '../models';
import { LoggerService } from './logger.service';
import { FuzzyService } from './fuzzy.service';
import { ImageProviderService } from './image-provider.service';
import { FileParser, VariableParser } from '../lib';
import { availableProviders } from '../lib/image-providers';
import { BehaviorSubject } from "rxjs";
import { gApp } from "../app.global";
import * as schemas from '../schemas';
import * as modifiers from '../modifiers';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as paths from '../../shared/paths';

@Injectable()
export class ParsersService {
    private fileParser: FileParser;
    private userConfigurations: BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>;
    private deletedConfigurations: BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>;
    private validator: JsonValidator = new JsonValidator(schemas.userConfiguration, { controlProperty: 'version', modifierFields: modifiers.userConfiguration });
    private savingIsDisabled: boolean = false;

    constructor(private fuzzyService: FuzzyService, private loggerService: LoggerService, private http: Http) {
        this.fileParser = new FileParser(this.fuzzyService);
        this.userConfigurations = new BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>([]);
        this.deletedConfigurations = new BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>([]);
        this.readUserConfigurations();
    }

    get lang() {
        return gApp.lang.parsers.service;
    }

    getUserConfigurations() {
        return this.userConfigurations.asObservable();
    }

    getUserConfigurationsArray() {
        return this.userConfigurations.getValue();
    }

    getDeletedConfigurations() {
        return this.deletedConfigurations.asObservable();
    }

    getDefaultValues() {
        return this.validator.getDefaultValues() as UserConfiguration;
    }

    saveConfiguration(config: { saved: UserConfiguration, current: UserConfiguration }) {
        let userConfigurations = this.userConfigurations.getValue();
        userConfigurations = userConfigurations.concat(_.cloneDeep(config));
        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    swapIndex(currentIndex: number, newIndex: number) {
        let userConfigurations = this.userConfigurations.getValue();

        let temp = userConfigurations[currentIndex];
        userConfigurations[currentIndex] = userConfigurations[newIndex];
        userConfigurations[newIndex] = temp;

        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    updateConfiguration(index: number, config?: UserConfiguration) {
        let userConfigurations = this.userConfigurations.getValue();

        if (config === undefined) {
            if (userConfigurations[index].current == null)
                return;
            else
                userConfigurations[index] = { saved: userConfigurations[index].current, current: null };
        }
        else
            userConfigurations[index] = { saved: config, current: null };

        this.userConfigurations.next(userConfigurations);
        this.saveUserConfigurations();
    }

    setCurrentConfiguration(index: number, config: UserConfiguration) {
        let userConfigurations = this.userConfigurations.getValue();
        userConfigurations[index].current = config;
        this.userConfigurations.next(userConfigurations);
    }

    deleteConfiguration(index: number) {
        let userConfigurations = this.userConfigurations.getValue();

        if (userConfigurations.length > index && index >= 0) {
            let deletedConfigurations = this.deletedConfigurations.getValue();

            deletedConfigurations = deletedConfigurations.concat(userConfigurations.splice(index, 1));

            this.deletedConfigurations.next(deletedConfigurations);
            this.userConfigurations.next(userConfigurations);
            this.saveUserConfigurations();
        }
    }

    restoreConfiguration(index?: number) {
        let deletedConfigurations = this.deletedConfigurations.getValue();
        if (index == undefined)
            index = 0;

        if (deletedConfigurations.length > index && index >= 0) {
            let userConfigurations = this.userConfigurations.getValue();

            userConfigurations = userConfigurations.concat(deletedConfigurations.splice(index, 1));

            this.deletedConfigurations.next(deletedConfigurations);
            this.userConfigurations.next(userConfigurations);
            this.saveUserConfigurations();
        }
    }

    getAvailableParsers() {
        return this.fileParser.getAvailableParsers();
    }

    getParserInfo(parser: string) {
        return this.fileParser.getParserInfo(parser);
    }

    executeFileParser(...configs: UserConfiguration[]) {
        let invalidConfigTitles: string[] = [];
        let skipped: string[] = [];
        let validConfigs: UserConfiguration[] = [];

        if (configs.length === 0) {
            let configArray = this.getUserConfigurationsArray();
            for (let i = 0; i < configArray.length; i++) {
                if (configArray[i].saved.disabled)
                    skipped.push(configArray[i].saved.configTitle);
                else
                    configs.push(configArray[i].saved);
            }
        }

        configs = _.cloneDeep(configs);

        for (let i = 0; i < configs.length; i++) {
            if (this.isConfigurationValid(configs[i]))
                validConfigs.push(configs[i]);
            else
                invalidConfigTitles.push(configs[i].configTitle || this.lang.text.noTitle);
        }

        return this.fileParser.executeFileParser(validConfigs).then((parsedData) => {
            return { parsedData: parsedData, invalid: invalidConfigTitles, skipped: skipped };
        });
    }

    validate(key: string, data: any) {
        switch (key) {
            case 'parserType':
                {
                    let availableParsers = this.getAvailableParsers();
                    return (availableParsers.indexOf(data) !== -1) ? null : this.lang.validationErrors.parserType__md;
                }
            case 'configTitle':
                return data ? null : this.lang.validationErrors.configTitle__md;
            case 'steamCategory':
                return this.validateVariableParserString(data || '');
            case 'executableLocation':
                return (data == null || data.length === 0 || this.validatePath(data || '', false)) ? null : this.lang.validationErrors.executable__md;
            case 'romDirectory':
                return this.validatePath(data || '', true) ? null : this.lang.validationErrors.romDir__md;
            case 'steamDirectory':
                return this.validatePath(data || '', true) ? null : this.lang.validationErrors.steamDir__md;
            case 'startInDirectory':
                return (data == null || data.length === 0 || this.validatePath(data || '', true)) ? null : this.lang.validationErrors.startInDir__md;
            case 'specifiedAccounts':
                return this.validateVariableParserString(data || '');
            case 'parserInputs':
                {
                    let availableParser = this.getParserInfo(data['parser']);
                    if (availableParser) {
                        if (availableParser.inputs === undefined)
                            return this.lang.validationErrors.parserInput.noInput;
                        else if (availableParser.inputs[data['input']] === undefined)
                            return this.lang.validationErrors.parserInput.inputNotAvailable__i.interpolate({ name: data['input'] });
                        else if (availableParser.inputs[data['input']].forcedInput || availableParser.inputs[data['input']].validationFn === undefined)
                            return null;
                        else
                            return availableParser.inputs[data['input']].validationFn(data['inputData']);
                    }
                    else
                        return this.lang.validationErrors.parserInput.incorrectParser;
                }
            case 'titleModifier':
                return data ? this.validateVariableParserString(data || '') : this.lang.validationErrors.titleModifier__md;
            case 'onlineImageQueries':
                return this.validateVariableParserString(data || '');
            case 'imageProviders':
                return _.isArray(data) ? null : this.lang.validationErrors.imageProviders__md;
                case 'imagePool':
                return data ? this.validateVariableParserString(data || '') : this.lang.validationErrors.imagePool__md;
            case 'localImages':
            case 'localIcons':
                return this.fileParser.validateFieldGlob(data || '');
            default:
                return this.lang.validationErrors.unhandledValidationKey__md;
        }
    }

    private validateVariableParserString(input: string) {
        if (input.length === 0 || VariableParser.isValidString('${', '}', input))
            return null;
        else
            return this.lang.validationErrors.variableString__md;
    }

    private validatePath(fsPath: string, checkForDirectory: boolean) {
        try {
            let path = fs.statSync(fsPath);
            return checkForDirectory ? path.isDirectory() : path.isFile();
        } catch (e) {
            return false;
        }
    }

    isConfigurationValid(config: UserConfiguration) {
        let simpleValidations: string[] = [
            'parserType', 'configTitle', 'steamCategory',
            'executableLocation', 'romDirectory', 'steamDirectory',
            'specifiedAccounts', 'onlineImageQueries', 'titleModifier',
            'imageProviders', 'startInDirectory'
        ];

        for (let i = 0; i < simpleValidations.length; i++) {
            if (this.validate(simpleValidations[i], config[simpleValidations[i]]) !== null)
                return false;
        }

        let availableParser = this.getParserInfo(config.parserType);
        if (availableParser.inputs !== undefined) {
            let parserInputs = config.parserInputs;
            for (let inputName in availableParser.inputs) {
                if (this.validate('parserInputs', { parser: config.parserType, input: inputName, inputData: parserInputs[inputName] }) !== null)
                    return false;
            }
        }

        return true;
    }

    private saveUserConfigurations() {
        return new Promise<UserConfiguration[]>((resolve, reject) => {
            if (!this.savingIsDisabled) {
                fs.outputFile(paths.userConfigurations, JSON.stringify(this.userConfigurations.getValue().map((item) => {
                    item.saved['version'] = modifiers.userConfigurationVersion;
                    return item.saved;
                }), null, 4), (error) => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            }
            else
                resolve();
        }).then().catch((error) => {
            this.loggerService.error(this.lang.error.savingConfiguration, { invokeAlert: true, alertTimeout: 5000 });
            this.loggerService.error(error);
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
            let validatedConfigs: { saved: UserConfiguration, current: UserConfiguration }[] = [];
            let errorString: string = '';
            for (let i = 0; i < data.length; i++) {
                let errors = this.validator.validate(data[i]);
                if (!errors)
                    validatedConfigs.push({ saved: data[i], current: null });
                else
                    errorString += `\r\n[${i}]:\r\n    ${JSON.stringify(errors, null, 4).replace(/\n/g, '\n    ')}`;
            };
            if (errorString.length > 0) {
                this.savingIsDisabled = true;
                this.loggerService.error(this.lang.error.readingConfiguration, { invokeAlert: true, alertTimeout: 5000, doNotAppendToLog: true });
                this.loggerService.error(this.lang.error.corruptedConfiguration__i.interpolate({
                    file: paths.userConfigurations,
                    error: errorString
                }));
            }
            this.userConfigurations.next(validatedConfigs);
        }).catch((error) => {
            this.loggerService.error(this.lang.error.readingConfiguration, { invokeAlert: true, alertTimeout: 5000 });
            this.loggerService.error(error);
        });
    }
}