import { CustomVariablesService } from './custom-variables.service';
import { UserExceptionsService } from './user-exceptions.service';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { UserConfiguration, ParsedUserConfiguration, AppSettings, EnvironmentVariables } from '../../models';
import { LoggerService } from './logger.service';
import { FuzzyService } from './fuzzy.service';
import { ImageProviderService } from './image-provider.service';
import { SettingsService } from './settings.service';
import { FileParser, VariableParser } from '../../lib';
import { BehaviorSubject } from "rxjs";
import {availableProviders} from "../../lib/image-providers/available-providers"
import { APP } from '../../variables';
import * as json from "../../lib/helpers/json";
import * as parserInfo from '../../lib/parsers/available-parsers';
import * as unique_ids from "../../lib/helpers/unique-ids";
import * as paths from "../../paths";
import * as path from 'path';
import * as schemas from '../schemas';
import * as modifiers from '../modifiers';
import * as fs from 'fs-extra';
import * as _ from 'lodash';

@Injectable()
export class ParsersService {
  private appSettings: AppSettings;
  private fileParser: FileParser;
  private userConfigurations: BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>;
  private deletedConfigurations: BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>;
  private validator: json.Validator = new json.Validator(schemas.userConfiguration, modifiers.userConfiguration);
  private defaultValidator: json.Validator = new json.Validator(schemas.defaultUserConfiguration, modifiers.userConfiguration);
  private savingIsDisabled: boolean = false;

  constructor(private fuzzyService: FuzzyService, private loggerService: LoggerService, private cVariableService: CustomVariablesService,
    private exceptionsService: UserExceptionsService, private settingsService: SettingsService, private http: Http) {
    this.fileParser = new FileParser(this.fuzzyService);
    this.userConfigurations = new BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>([]);
    this.deletedConfigurations = new BehaviorSubject<{ saved: UserConfiguration, current: UserConfiguration }[]>([]);
    this.readUserConfigurations();
    this.cVariableService.dataObservable
      .subscribe((variables) => {
        this.fileParser.setCustomVariables(variables);
      });
    this.exceptionsService.dataObservable
      .subscribe((data)=>{
        this.fileParser.setUserExceptions(data.saved||{titles: {}});
      })
    this.settingsService.onLoad((appSettings: AppSettings) => {
      this.appSettings = appSettings;
    });
  }

  get lang() {
    return APP.lang.parsers.service;
  }

  getUserConfigurations() {
    return this.userConfigurations.asObservable();
  }

  getUserConfigurationsArray() {
    return this.userConfigurations.getValue();
  }

  getKnownSteamDirectories() {
    let preParser = new VariableParser({ left: '${', right: '}' });
    let steamdirs = this.getUserConfigurationsArray().map(config => {
      let parsedSteamPath = preParser.setInput(config.saved.steamDirectory).parse() ? preParser.replaceVariables((variable) => {
        return this.fileParser.getEnvironmentVariable(variable as EnvironmentVariables, this.appSettings).trim()
      }) : '';
      return parsedSteamPath;
    }).filter(path => path!=="");
    if(this.appSettings.environmentVariables.steamDirectory) {
      steamdirs.push(this.appSettings.environmentVariables.steamDirectory)
    }
    return _.uniq(steamdirs)
  }

  getDeletedConfigurations() {
    return this.deletedConfigurations.asObservable();
  }

  getDefaultValues() {
    return this.defaultValidator.getDefaultValues() as UserConfiguration;
  }

  saveConfiguration(config: { saved: UserConfiguration, current: UserConfiguration }) {
    let userConfigurations = this.userConfigurations.getValue();
    let copy: { saved: UserConfiguration, current: UserConfiguration } = _.cloneDeep(config);
    copy.saved.parserId = unique_ids.newParserId();
    userConfigurations = userConfigurations.concat(copy);
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

  changeEnabledStatus(parserId: string, enabled: boolean) {
    let userConfigurations = this.userConfigurations.getValue();
    let updateIndex = userConfigurations.map(e=>e.saved.parserId).indexOf(parserId);
    userConfigurations[updateIndex].saved.disabled = !enabled;
    this.userConfigurations.next(userConfigurations);
    this.saveUserConfigurations();
  }
  changeEnabledStatusAll(enabled: boolean) {
    let userConfigurations = this.userConfigurations.getValue();
    for(let i=0; i < userConfigurations.length; i++) {
      userConfigurations[i].saved.disabled = !enabled;
    }
    this.userConfigurations.next(userConfigurations);
    this.saveUserConfigurations();
  }

  updateConfiguration(index: number, config?: UserConfiguration) {
    let userConfigurations = this.userConfigurations.getValue();

    if (config === undefined) {
      if (userConfigurations[index].current == null)
        return;
      else
        userConfigurations[index].current.parserId = userConfigurations[index].saved.parserId;
      if(userConfigurations[index].current.parserType==='Steam') {
        userConfigurations[index].current.fuzzyMatch.use=false;
        userConfigurations[index].current.titleFromVariable.tryToMatchTitle=false;
      }
      userConfigurations[index] = { saved: userConfigurations[index].current, current: null };
    }
    else {
      config.parserId = userConfigurations[index].saved.parserId;
      userConfigurations[index] = { saved: config, current: null };
    }

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

  getParserInfo(parserType: string) {
    return this.fileParser.getParserInfo(parserType);
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
    return this.fileParser.executeFileParser(validConfigs,this.appSettings).then((parsedData) => {
      return { parsedData: parsedData, invalid: invalidConfigTitles, skipped: skipped };
    });
  }

  validate(key: string, data: any,options?: any) {
    switch (key) {
      case 'parserType':
        {
          return (parserInfo.availableParsers.indexOf(data) !== -1) ? null : this.lang.validationErrors.parserType__md;
        }
      case 'configTitle':
        return data ? null : this.lang.validationErrors.configTitle__md;
      case 'parserId':
        return data ? null : this.lang.validationErrors.parserId__md;
      case 'steamCategory':
        return this.validateVariableParserString(data || '');
      case 'executable':
        return ((data||{}).path == null || data.path.length == 0 || this.validateEnvironmentPath(data.path || '') ) ? null : this.lang.validationErrors.executable__md;
      case 'romDirectory':
        return this.validateEnvironmentPath(data || '', true) ? null : this.lang.validationErrors.romDir__md;
      case 'steamDirectory':
        return this.validateEnvironmentPath(data || '', true) ? null : this.lang.validationErrors.steamDir__md;
      case 'startInDirectory':
        return (data == null || data.length === 0 || this.validateEnvironmentPath(data || '', true)) ? null : this.lang.validationErrors.startInDir__md;
      case 'userAccounts':
        {
          if(options && options.parserType=='Steam') {
            return data && data.specifiedAccounts ? this.validateVariableParserString(data.specifiedAccounts||'') : this.lang.validationErrors.userAccounts__md;
          } else{
            return this.validateVariableParserString((data||{}).specifiedAccounts || '');
          }
        }
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
        return this.validateVariableParserString(data || '', this.lang.validationErrors.titleModifier__md);
      case 'executableModifier':
        return this.validateVariableParserString(data || '', this.lang.validationErrors.executableModifier__md);
      case 'titleFromVariable':
        return this.validateVariableParserString(data ? data.limitToGroups || '' : '');
      case 'onlineImageQueries':
      case 'executableArgs':
        return this.validateVariableParserString(data || '');
      case 'imageProviders':
        return _.isArray(data) ? null : this.lang.validationErrors.imageProviders__md;
      case 'imagePool':
        return this.validateVariableParserString(data || '', this.lang.validationErrors.imagePool__md);
      case 'defaultImage':
        return !data || this.validateEnvironmentPath(data || '', false) ? null : this.lang.validationErrors.defaultImage__md;
      case 'defaultTallImage':
        return !data || this.validateEnvironmentPath(data || '', false) ? null : this.lang.validationErrors.defaultImage__md;
      case 'defaultHeroImage':
        return !data || this.validateEnvironmentPath(data || '', false) ? null : this.lang.validationErrors.defaultImage__md;
      case 'defaultLogoImage':
        return !data || this.validateEnvironmentPath(data || '', false) ? null : this.lang.validationErrors.defaultImage__md;
      case 'defaultIcon':
        return !data || this.validateEnvironmentPath(data || '', false) ? null : this.lang.validationErrors.defaultImage__md;
      case 'localImages':
        return this.fileParser.validateFieldGlob(data || '');
      case 'localTallImages':
        return this.fileParser.validateFieldGlob(data || '');
      case 'localHeroImages':
        return this.fileParser.validateFieldGlob(data || '');
      case 'localLogoImages':
        return this.fileParser.validateFieldGlob(data || '');
      case 'localIcons':
        return this.fileParser.validateFieldGlob(data || '');
      default:
        return this.lang.validationErrors.unhandledValidationKey__md;
    }
  }

  private validateVariableParserString(input: string, emptyError?: string) {
    let canBeEmpty = emptyError == undefined;

    if (!canBeEmpty)
      input = input.trim();

    if (canBeEmpty || (!canBeEmpty && input.length > 0))
      return VariableParser.isValidString('${', '}', input) ? null : this.lang.validationErrors.variableString__md;
    else
      return emptyError;
  }

  private validatePath(fsPath: string, checkForDirectory?: boolean) {
    try {
      let path = fs.statSync(fsPath);
      if (checkForDirectory !== undefined)
        return checkForDirectory ? path.isDirectory() : path.isFile();
      else
        return true;
    } catch (e) {
	  if (process.env["IN_FLATPAK"]) {
		try {
			let path = fs.statSync("/var/run/host" + fsPath);
			if (checkForDirectory !== undefined)
			  return checkForDirectory ? path.isDirectory() : path.isFile();
			else
			  return true;
		} catch (e) {
			return false;
		}
	  }
      return false;
    }
  }

  private validateEnvironmentPath(pathwithvar: string, checkForDirectory?:boolean) {
    let preParser = new VariableParser({ left: '${', right: '}' });
    let parsedPath = preParser.setInput(pathwithvar).parse() ? preParser.replaceVariables((variable) => {
      return this.fileParser.getEnvironmentVariable(variable as EnvironmentVariables,this.appSettings).trim()
    }) : '';
    return this.validatePath(parsedPath, checkForDirectory)
  }

  isConfigurationValid(config: UserConfiguration) {

    let simpleValidations: string[];
    if(this.validate('parserType',config['parserType'])!==null){
      return false;
    }
    if(parserInfo.artworkOnlyParsers.includes(config['parserType'])) {
      simpleValidations = ['configTitle','parserId','steamDirectory','titleModifier',
        'onlineImageQueries', 'imagePool', 'imageProviders',
        'defaultImage','defaultTallImage','defaultHeroImage','defaultLogoImage','defaultIcon','localImages', 'localTallImages','localHeroImages','localLogoImages','localIcons'
      ]
    } else if(parserInfo.platformParsers.includes(config['parserType'])) {
      simpleValidations = ['configTitle','parserId','steamDirectory','steamCategory','titleModifier',
        'onlineImageQueries', 'imagePool', 'imageProviders',
        'defaultImage','defaultTallImage','defaultHeroImage','defaultLogoImage','defaultIcon','localImages', 'localTallImages','localHeroImages','localLogoImages','localIcons'
      ]
    }
    else if(parserInfo.ROMParsers.includes(config['parserType'])) {
      simpleValidations = [
        'configTitle', 'parserId', 'steamCategory',
        'executable', 'executableModifier', 'romDirectory',
        'steamDirectory', 'startInDirectory',
        'titleFromVariable', 'titleModifier', 'executableArgs',
        'onlineImageQueries', 'imagePool', 'imageProviders',
        'defaultImage','defaultTallImage','defaultHeroImage','defaultLogoImage','defaultIcon','localImages', 'localTallImages','localHeroImages','localLogoImages','localIcons'
      ];
    }

    if(this.validate('userAccounts', config['userAccounts'], {parserType: config['parserType']}) !== null) {
      return false;
    }

    for (let i = 0; i < simpleValidations.length; i++) {
      if (this.validate(simpleValidations[i], config[simpleValidations[i]]) !== null){
        return false;
      }
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
  getParserId(configurationIndex: number) {
    return this.userConfigurations.getValue()[configurationIndex].saved.parserId;
  }

  private saveUserConfigurations() {
    return new Promise<UserConfiguration[]>((resolve, reject) => {
      if (!this.savingIsDisabled) {

        fs.outputFile(paths.userConfigurations, JSON.stringify(this.userConfigurations.getValue().map((item) => {
          item.saved[modifiers.userConfiguration.controlProperty] = modifiers.userConfiguration.latestVersion;
          if(!item.saved.parserType) {
            throw new Error(this.lang.error.parserTypeMissing);
          }
          for(let key of Object.keys(item.saved.parserInputs)) {
            if(!parserInfo.availableParserInputs[item.saved.parserType].includes(key)) {
              delete item.saved.parserInputs[key]
            }
          }
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
      let updateNeeded: boolean = false;
      for (let i = 0; i < data.length; i++) {
        // TODO get rid of this ugly hack for making specified accounts mandatory for steam parser only
        data[i].userAccounts.specifiedAccounts = data[i].userAccounts.specifiedAccounts || '';
        updateNeeded=true;
        if(['Epic','Steam'].includes(data[i].parserType)) {
          data[i].fuzzyMatch.use = false;
          data[i].titleFromVariable.tryToMatchTitle = false;
          data[i].executableModifier = "\"${exePath}\"";
        }
        if (this.validator.validate(data[i]).isValid()) {
          validatedConfigs.push({ saved: data[i], current: null });
        }
        else {
          errorString += `\r\n[Config ${i} with title ${data[i].configTitle||''}]:\r\n    ${this.validator.errorString.replace(/\n/g, '\n    ')}`;
        }
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
      if(updateNeeded) {
        this.saveUserConfigurations();
      }
    }).catch((error) => {
      this.loggerService.error(this.lang.error.readingConfiguration, { invokeAlert: true, alertTimeout: 5000 });
      this.loggerService.error(error);
    });
  }
}
