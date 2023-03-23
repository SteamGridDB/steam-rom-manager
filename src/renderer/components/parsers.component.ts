import { VariableParser } from '../../lib';
import { clipboard } from 'electron';
import { Component, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { ParsersService, LoggerService, ImageProviderService, SettingsService, ConfigurationPresetsService } from '../services';
import * as parserInfo from '../../lib/parsers/available-parsers';
import * as steam from '../../lib/helpers/steam';
import { controllerTypes, controllerNames } from '../../lib/controller-manager';
import { UserConfiguration, NestedFormElement, AppSettings, ConfigPresets, ControllerTemplates } from '../../models';
import { Subscription, Observable } from "rxjs";
import { APP } from '../../variables';
import * as _ from 'lodash';
@Component({
  selector: 'parsers',
  templateUrl:'../templates/parsers.component.html',
  styleUrls: [
    '../styles/parsers.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParsersComponent implements AfterViewInit, OnDestroy {
  private currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
  private subscriptions: Subscription = new Subscription();
  private userConfigurations: { saved: UserConfiguration, current: UserConfiguration }[] = [];
  private controllerTemplates: ControllerTemplates = {};
  private configurationIndex: number = -1;
  private loadedIndex: number = null;
  private isUnsaved: boolean = false;
  private vParser = new VariableParser({ left: '${', right: '}' });
  private appSettings: AppSettings;
  private configPresets: ConfigPresets = {};
  private nestedGroup: NestedFormElement.Group;
  private userForm: FormGroup;
  private formChanges: Subscription = new Subscription();
  private hiddenSections: {[parserId: string]: {[sectionName: string]: boolean}}


  constructor(
    private parsersService: ParsersService,
    private loggerService: LoggerService,
    private settingsService: SettingsService,
    private imageProviderService: ImageProviderService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private changeRef: ChangeDetectorRef,
    private cpService: ConfigurationPresetsService) {

      this.appSettings = this.settingsService.getSettings();

      this.nestedGroup = new NestedFormElement.Group({
        children: {
          basicSection: new NestedFormElement.Section({
            label: 'Basic Configuration'
          }),
          parserType: new NestedFormElement.Select({
            label: this.lang.label.parserType,
            placeholder: this.lang.placeholder.parserType,
            values: parserInfo.availableParsers,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              let parser = this.parsersService.getParserInfo(self.value);
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = parser ? parser.info : this.lang.docs__md.parserType.join('');
            },
            onChange: (self, path) => {
              let completePath = path.join();
              if (this.currentDoc.activePath === completePath) {
                let parser = this.parsersService.getParserInfo(self.value);
                this.currentDoc.content = parser ? parser.info : this.lang.docs__md.parserType.join('');
              }
            }
          }),
          configTitle: new NestedFormElement.Input({
            label: this.lang.label.configTitle,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.configTitle.join('');
            }
          }),
          steamCategory: new NestedFormElement.Input({
            isHidden: () => this.isHiddenIfArtworkOnlyParser(),
              label: this.lang.label.steamCategory,
            highlight: this.highlight.bind(this),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.steamCategory.join('');
            }
          }),
          steamDirectory: new NestedFormElement.Path({
            directory: true,
            label: this.lang.label.steamDirectory,
            highlight: this.highlight.bind(this),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.steamDirectory.join('');
            }
          }),
          userAccounts: new NestedFormElement.Group({
            label: this.lang.label.userAccounts,
            children: {
              specifiedAccounts: new NestedFormElement.Input({
                highlight: this.highlight.bind(this),
                onValidateObservable: () => this.userForm.get('parserType').valueChanges,
                  onValidate: (self, path) => {
                  let serialized = {}
                  serialized[path[1]] = self.value
                  return this.parsersService.validate(path[0] as keyof UserConfiguration, serialized, {parserType: this.userForm.get('parserType').value});
                }
              }),
              skipWithMissingDataDir: new NestedFormElement.Toggle({
                text: this.lang.text.skipWithMissingDataDir
              }),
              useCredentials: new NestedFormElement.Toggle({
                text: this.lang.text.useCredentials
              })
            },
            onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.userAccounts.join('');
            }
          }),
          romDirectory: new NestedFormElement.Path({
            isHidden: () => this.isHiddenIfNotRomsParser(),
              directory: true,
            label: this.lang.label.romDirectory,
            highlight: this.highlight.bind(this),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.romDirectory.join('');
            }
          }),
          executableSection: new NestedFormElement.Section({
            label: 'Executable Configuration',
            isHidden: () => this.isHiddenIfNotRomsParser()
          }),
          executable: new NestedFormElement.Group({
            isHidden: () => this.isHiddenIfNotRomsParser(),
              label: this.lang.label.executableLocation,
            children: {
              path: new NestedFormElement.Path({
                highlight: this.highlight.bind(this),
                onValidate: (self, path) => {
                  let serialized = {};
                  serialized[path[1]] = self.value;
                  return this.parsersService.validate(path[0] as keyof UserConfiguration, serialized)
                }
              }),
              shortcutPassthrough: new NestedFormElement.Toggle({
                text: this.lang.text.shortcut_passthrough
              }),
              appendArgsToExecutable: new NestedFormElement.Toggle({
                isHidden: () => this.isHiddenIfNotRomsParser(),
                  text: this.lang.text.appendArgsToExecutable
              })
            },
            onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.executableLocation.join('');
            }
          }),
          executableArgs: new NestedFormElement.Input({
            isHidden: () => this.isHiddenIfNotRomsParser(),
              label: this.lang.label.executableArgs,
            highlight: this.highlight.bind(this),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.executableArgs.join('');
            }
          }),
          executableModifier: new NestedFormElement.Input({
            isHidden: () => this.isHiddenIfNotRomsParser(),
              highlight: this.highlight.bind(this),
            label: this.lang.label.executableModifier,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.executableModifier.join('');
            }
          }),
          startInDirectory: new NestedFormElement.Path({
            directory: true,
            label: this.lang.label.startInDirectory,
            highlight: this.highlight.bind(this),
            isHidden: () => this.isHiddenIfNotRomsParser(),
              onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.startInDirectory.join('');
            }
          }),
          parserInputsSection: new NestedFormElement.Section({
            label: 'Parser Specific Configuration',
            isHidden: () => this.isHiddenIfArtworkOnlyOrBlank()
          }),
          parserInputs: (() => {
            let parserInputs = {};
            let parsers = parserInfo.availableParsers;
            for (let i = 0; i < parsers.length; i++) {
              let parser = this.parsersService.getParserInfo(parsers[i]);
              if (parser && parser.inputs !== undefined) {
                for (let inputFieldName in parser.inputs) {
                  let input = parser.inputs[inputFieldName];
                  if(input.inputType == 'path' || input.inputType == 'dir') {
                    parserInputs[inputFieldName] = new NestedFormElement.Path({

                      directory: input.inputType=='dir' ? true : false,
                      initialValue: input.forcedInput !== undefined ? input.forcedInput : null,
                      highlight: this.highlight.bind(this),
                      label: input.label,
                      isHidden: () => {
                        return Observable.concat(Observable.of(this.userForm.get('parserType').value), this.userForm.get('parserType').valueChanges).map((pType: string) => {
                          return pType !== parsers[i];
                        });
                      },
                      onValidate: (self, path) => {
                        if (parsers[i]!=='Steam' && this.userForm.get('parserType').value === parsers[i])
                          return this.parsersService.validate(path[0] as keyof UserConfiguration, { parser: parsers[i], input: inputFieldName, inputData: self.value });
                        else
                          return null;
                      },
                      onInfoClick: (self, path) => {
                        this.currentDoc.activePath = path.join();
                        this.currentDoc.content = input.info;
                      }
                    })
                  } else if (input.inputType == 'text') {
                    parserInputs[inputFieldName] = new NestedFormElement.Input({
                      initialValue: input.forcedInput !== undefined ? input.forcedInput : null,
                      highlight: this.highlight.bind(this),
                      label: input.label,
                      isHidden: () => {
                        return Observable.concat(Observable.of(this.userForm.get('parserType').value), this.userForm.get('parserType').valueChanges).map((pType: string) => {
                          return pType !== parsers[i];
                        });
                      },
                      onValidate: (self, path) => {
                        if (parsers[i]!=='Steam' && this.userForm.get('parserType').value === parsers[i])
                          return this.parsersService.validate(path[0] as keyof UserConfiguration, { parser: parsers[i], input: inputFieldName, inputData: self.value });
                        else
                          return null;
                      },
                      onInfoClick: (self, path) => {
                        this.currentDoc.activePath = path.join();
                        this.currentDoc.content = input.info;
                      }
                    })
                  } else if (input.inputType == 'toggle') {
                    parserInputs[inputFieldName] = new NestedFormElement.Toggle({
                      text: input.label,
                      isHidden: () => {
                        return Observable.concat(Observable.of(this.userForm.get('parserType').value), this.userForm.get('parserType').valueChanges).map((pType: string) => {
                          return pType !== parsers[i];
                        });
                      },
                    });
                  }
                }
              }
            }

            return new NestedFormElement.Group({
              children: parserInputs
            });
          })(),
          titleSection: new NestedFormElement.Section({
            label: 'Title Modification Configuration'
          }),
          titleFromVariable: new NestedFormElement.Group({
            isHidden: () => this.isHiddenIfNotRomsParser(),
              label: this.lang.label.titleFromVariable,
            children: {
              limitToGroups: new NestedFormElement.Input({
                highlight: this.highlight.bind(this),
                onValidate: (self, path) => {
                  let serialized = {};
                  serialized[path[1]] = self.value;
                  return this.parsersService.validate(path[0] as keyof UserConfiguration, serialized)
                }
              }),
              caseInsensitiveVariables: new NestedFormElement.Toggle({
                text: this.lang.text.caseInsensitiveVariables
              }),
              skipFileIfVariableWasNotFound: new NestedFormElement.Toggle({
                text: this.lang.text.skipFileIfVariableWasNotFound
              }),
              tryToMatchTitle: new NestedFormElement.Toggle({
                text: this.lang.text.tryToMatchTitle
              })
            },
            onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.titleFromVariable.join('');
            }
          }),
          titleModifier: new NestedFormElement.Input({
            highlight: this.highlight.bind(this),
            label: this.lang.label.titleModifier,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.titleModifier.join('');
            }
          }),
          fuzzyMatch: new NestedFormElement.Group({
            label: this.lang.label.fuzzyMatch,
            children: {
              replaceDiacritics: new NestedFormElement.Toggle({
                text: this.lang.text.fuzzy_replaceDiacritic
              }),
              removeCharacters: new NestedFormElement.Toggle({
                text: this.lang.text.fuzzy_removeCharacters
              }),
              removeBrackets: new NestedFormElement.Toggle({
                text: this.lang.text.fuzzy_removeBrackets
              })
            },
            onInfoClick: (control, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.fuzzyMatch.join('');
            }
          }),
          controllerSection: new NestedFormElement.Section({
            label: 'Controller Templates Configuration',
            isHidden: () => this.isHiddenIfArtworkOnlyParser(),
          }),
          fetchControllerTemplatesButton: new NestedFormElement.Button({
            buttonLabel: 'Re-fetch Controller Templates',
            onClickMethod: this.fetchControllerTemplates.bind(this)
          }),
          removeControllersButton: new NestedFormElement.Button({
            buttonLabel: 'Unset All Controllers',
            onClickMethod: this.removeControllers.bind(this)
          }),
          controllers: new NestedFormElement.Group({
            children: (() => {
              let children = {};
              for(let controllerType of controllerTypes) {
                children[controllerType] = new NestedFormElement.Select({
                  label: controllerNames[controllerType]+" Template",
                  placeholder: 'Select a Template',
                  multiple: false,
                  allowEmpty: true,
                  values: [],
                  onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.controllerTemplates.join('');
                  }
                })
              }
              return children;
            })()
          }),
          onlineImageSection: new NestedFormElement.Section({
            label: 'Artwork Provider Configuration'
          }),
          imageProviders: new NestedFormElement.Select({
            label: this.lang.label.imageProviders,
            placeholder: this.lang.placeholder.imageProviders,
            multiple: true,
            allowEmpty: true,
            values: this.imageProviderService.instance.getAvailableProviders(),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.imageProviders.join('');
            }
          }),
          imageProviderAPIs: (()=>{
            let imageProviderAPIs = {};
            let providerNames = this.imageProviderService.instance.getAvailableProviders();
            for (let i=0;i < providerNames.length; i++) {
              let provider = this.imageProviderService.instance.getProviderInfo(providerNames[i]);
              let providerL = this.imageProviderService.instance.getProviderInfoLang(providerNames[i]);
              if (provider && provider.inputs !== undefined) {
                imageProviderAPIs[providerNames[i]] = (()=>{
                  let apiInputs = {}
                  for (let inputFieldName in provider.inputs) {
                    let input = provider.inputs[inputFieldName];
                    if(input.inputType == 'toggle') {
                      apiInputs[inputFieldName] = new NestedFormElement.Toggle({
                        text: providerL.inputs[inputFieldName].label
                      });
                    }
                    else if (input.inputType == 'multiselect') {
                      apiInputs[inputFieldName] = new NestedFormElement.Select({
                        label: providerL.inputs[inputFieldName].label,
                        multiple: input.multiple,
                        allowEmpty: input.allowEmpty,
                        placeholder: this.lang.placeholder.multiAPIPlaceholder,
                        values: input.allowedValues.map((option: string) => {return {
                          value: option, displayValue: _.startCase(option.replace(/_/g," "))
                        }}),
                        onValidate: (self, path) => {
                          return null;
                        },
                        onInfoClick: (self, path) => {
                          this.currentDoc.activePath = path.join();
                          this.currentDoc.content = providerL.inputs[inputFieldName].info;
                        }
                      })
                    }
                  }
                  return new NestedFormElement.Group({
                    children: apiInputs
                  })
                })();
              }
            }
            return new NestedFormElement.Group({
              children: imageProviderAPIs
            })
          })(),
          onlineImageQueries: new NestedFormElement.Input({
            label: this.lang.label.onlineImageQueries,
            highlight: this.highlight.bind(this),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.onlineImageQueries.join('');
            }
          }),
          imagePool: new NestedFormElement.Input({
            label: this.lang.label.imagePool,
            highlight: this.highlight.bind(this),
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.imagePool.join('');
            }
          }),
          localImageSection: new NestedFormElement.Section({
            label: 'Local Artwork Configuration'
          }),
          defaultImage: new NestedFormElement.Path({
            directory: false,
            highlight: this.highlight.bind(this),
            label: this.lang.label.defaultImage,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.defaultImage.join('');
            }
          }),
          defaultTallImage: new NestedFormElement.Path({
            directory: false,
            highlight: this.highlight.bind(this),
            label: this.lang.label.defaultTallImage,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.defaultTallImage.join('');
            }
          }),
          defaultHeroImage: new NestedFormElement.Path({
            directory: false,
            highlight: this.highlight.bind(this),
            label: this.lang.label.defaultHeroImage,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.defaultHeroImage.join('');
            }
          }),
          defaultLogoImage: new NestedFormElement.Path({
            directory: false,
            highlight: this.highlight.bind(this),
            label: this.lang.label.defaultLogoImage,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.defaultLogoImage.join('');
            }
          }),
          defaultIcon: new NestedFormElement.Path({
            directory: false,
            highlight: this.highlight.bind(this),
            label: this.lang.label.defaultIcon,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.defaultIcon.join('');
            }
          }),
          localImages: new NestedFormElement.Path({
            directory: true,
            appendGlob: '${finalTitle}.@(png|PNG|jpg|JPG|webp|WEBP)',
            highlight: this.highlight.bind(this),
            label: this.lang.label.localImages,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.localImages.join('');
            }
          }),
          localTallImages: new NestedFormElement.Path({
            directory: true,
            appendGlob: '${finalTitle}.@(png|PNG|jpg|JPG|webp|WEBP)',
            highlight: this.highlight.bind(this),
            label: this.lang.label.localTallImages,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.localTallImages.join('');
            }
          }),
          localHeroImages: new NestedFormElement.Path({
            directory: true,
            appendGlob: '${finalTitle}.@(png|PNG|jpg|JPG|webp|WEBP)',
            highlight: this.highlight.bind(this),
            label: this.lang.label.localHeroImages,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.localHeroImages.join('');
            }
          }),
          localLogoImages: new NestedFormElement.Path({
            directory: true,
            appendGlob: '${finalTitle}.@(png|PNG|jpg|JPG|webp|WEBP)',
            highlight: this.highlight.bind(this),
            label: this.lang.label.localLogoImages,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.localLogoImages.join('');
            }
          }),

          localIcons: new NestedFormElement.Path({
            directory: true,
            appendGlob: '${finalTitle}.@(png|PNG|ico|ICO)',
            highlight: this.highlight.bind(this),
            label: this.lang.label.localIcons,
            onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
              onInfoClick: (self, path) => {
              this.currentDoc.activePath = path.join();
              this.currentDoc.content = this.lang.docs__md.localIcons.join('');
            }
          })
        }
      });
      this.currentDoc.content = this.lang.docs__md.intro.join('');
    }

    ngAfterViewInit() {
      this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((data) => {
        this.userConfigurations = data;
        this.loadConfiguration();
      })).add(this.activatedRoute.params.subscribe((params) => {
        this.configurationIndex = parseInt(params['index']);
        this.loadConfiguration();
        this.fetchControllerTemplates(false);
      })).add(this.cpService.dataObservable.subscribe((data) => {
        this.configPresets = data;
      })).add(this.parsersService.getSavedControllerTemplates().subscribe((data) => {
        this.controllerTemplates = data;
        this.fetchControllerTemplates(false);
      }))
    }

    private removeControllers() {
      let steamDirInput = this.userForm.get('steamDirectory').value || '';
      let steamDir = this.parsersService.parseSteamDir(steamDirInput);
      if(this.parsersService.validate('steamDirectory', steamDir) == null) {
        let userAccountsInfo = this.userForm.get('userAccounts').value;
        this.parsersService.parseUserAccounts(userAccountsInfo, steamDir).then((userIds)=>{
        for(let userId of userIds) {
          this.parsersService.removeControllers(steamDir, userId);
        }
        }).catch((error)=>{
          this.loggerService.error(this.lang.error.cannotParseUserIDs, {invokeAlert: true, alertTimeout: 3000 });
          this.loggerService.error(error);
        })
      }
    }

    private fetchControllerTemplates(force:boolean = true) {
      let steamDirInput = this.userForm.get('steamDirectory').value || '';
      let steamDir = this.parsersService.parseSteamDir(steamDirInput);
      if(this.parsersService.validate('steamDirectory', steamDir) == null) {
        if(force || !this.controllerTemplates[steamDir]) {
          this.controllerTemplates[steamDir] = {};
          for(let controllerType of controllerTypes) {
            this.controllerTemplates[steamDir][controllerType] = this.parsersService.getControllerTemplates(steamDir, controllerType);
          }
          this.parsersService.saveControllerTemplates(this.controllerTemplates);
        } else {
          for(let controllerType of Object.keys(this.controllerTemplates[steamDir])) {
            ((this.nestedGroup.children.controllers as NestedFormElement.Group).children[controllerType] as NestedFormElement.Select).values = this.controllerTemplates[steamDir][controllerType].map(template=>{
              return { displayValue: template.title, value: template }
          });
          }
        }
      } else if(force) {
        this.loggerService.error(this.lang.error.cannotFetchTemplates, { invokeAlert: true, alertTimeout: 3000 });
      }
    }

    private setPreset(key: string) {
      if (key != null) {
        const config = this.configPresets[key];
        if (this.loadedIndex === -1) {
          this.userForm.patchValue(config);
          this.changeRef.detectChanges();
        }
        else
          this.parsersService.setCurrentConfiguration(this.configurationIndex, config);
      }
    }

    private highlight(input: string, tag: string) {
      let output = '';

      if (this.vParser.setInput(input).parse()) {
        this.vParser.traverseAST((ast, item, level, passedData: string[]) => {
          if (level === 0) {
            if (item.type === 'string') {
              output += ast.input.substring(item.range.start, item.range.end);
            }
            else {
              let modLevel = level % 3;
              output += `<${tag} class="level-${modLevel}">${ast.leftDelimiter}</${tag}>${(passedData ? passedData.join('') : '')}<${tag} class="level-${modLevel}">${ast.rightDelimiter}</${tag}>`;
            }
          }
          else {
            if (item.type === 'string') {
              return ast.input.substring(item.range.start, item.range.end);
            }
            else {
              let modLevel = level % 3;
              return `<${tag} class="level-${modLevel}">${ast.leftDelimiter}</${tag}>${(passedData ? passedData.join('') : '')}<${tag} class="level-${modLevel}">${ast.rightDelimiter}</${tag}>`;
            }
          }
        }, false);
      }
      else
        output = input;

      return output;
    }
    private presetsInfoClick() {
      this.currentDoc.activePath = '';
      this.currentDoc.content = this.lang.docs__md.communityPresets.join('');
    }
    private isHiddenIfNotRomsParser() {
      return Observable.concat(Observable.of(this.userForm.get('parserType').value),this.userForm.get('parserType').valueChanges).map(pType => parserInfo.superTypesMap[pType] !== parserInfo.ROMType)
    }
    private isHiddenIfArtworkOnlyParser() {
      return Observable.concat(Observable.of(this.userForm.get('parserType').value),this.userForm.get('parserType').valueChanges).map(pType => parserInfo.superTypesMap[pType] === parserInfo.ArtworkOnlyType);
    }
    private isHiddenIfParserBlank() {
      return Observable.concat(Observable.of(this.userForm.get('parserType').value),this.userForm.get('parserType').valueChanges).map(pType => !pType)
    }

    // Not currently used but potentially very useful
    private isHiddenIfArtworkOnlyOrBlank() {
      return Observable.combineLatest(
        this.isHiddenIfArtworkOnlyParser(),
        this.isHiddenIfParserBlank()
      ).map(([ao,pb])=>ao||pb)
    }

    private get lang() {
      return APP.lang.parsers.component;
    }

    private openFAQ() {
      this.currentDoc.activePath = '';
      this.currentDoc.content = this.lang.docs__md.faq.join('');
    }

    private saveForm() {
      if (this.userConfigurations.length === 0 || this.configurationIndex === -1)
        this.parsersService.saveConfiguration({ saved: this.userForm.value as UserConfiguration, current: null });
      else
        this.parsersService.saveConfiguration(this.userConfigurations[this.configurationIndex]);

      this.router.navigate(['/parsers', this.userConfigurations.length - 1]);
    }

    private updateForm() {
      this.parsersService.updateConfiguration(this.configurationIndex);
    }

    private deleteForm() {
      this.parsersService.deleteConfiguration(this.configurationIndex);
      if (this.configurationIndex >= this.userConfigurations.length)
        this.router.navigate(['/parsers', this.userConfigurations.length - 1]);
    }

    private restoreForm() {
      this.parsersService.restoreConfiguration();
    }

    private toClipboard() {
      let config = this.userForm.value as UserConfiguration;
      config.parserId = this.configurationIndex===-1?'UNSAVED SO NO ID':this.parsersService.getParserId(this.configurationIndex);
      if (this.parsersService.isConfigurationValid(config)) {
        try {
          let text = '';

          let iterateGroup = (group: NestedFormElement.Group, path: string) => {
            let keys = Object.keys(group.children);

            if (group.label)
              text += `# ${group.label}\r\n`;

            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              const item = group.children[key];
              const itemPath = path.length > 0 ? `${path}.${key}` : key;

              if (item instanceof NestedFormElement.Group) {
                iterateGroup(item, itemPath);
              }
              else if (item instanceof NestedFormElement.Input || item instanceof NestedFormElement.Path) {
                let title = item.label;
                if (title)
                  text += `# ${title}\r\n`;

                text += `····${this.userForm.get(itemPath).value}\r\n`;
              }
              else if (item instanceof NestedFormElement.Toggle) {
                let title = item.label || item.text;

                text += `····${this.userForm.get(itemPath).value ? '[x]' : '[ ]'}: ${title}\r\n`;
              }
              else if (item instanceof NestedFormElement.Select) {
                let title = item.label;
                if (title)
                  text += `# ${title}\r\n`;

                text += `····Selected: ${this.userForm.get(itemPath).value}\r\n`;
              }
            }
          }

          iterateGroup(this.nestedGroup, '');

          clipboard.writeText(`\`\`\`\r\n${text}\`\`\``);
          this.loggerService.info(this.lang.info.copiedToClipboard, { invokeAlert: true, alertTimeout: 3000 });
        } catch (error) {
          this.loggerService.error(this.lang.error.failedToCopy, { invokeAlert: true, alertTimeout: 3000 });
          if (error)
            this.loggerService.error(error, { invokeAlert: true, alertTimeout: 3000 });
        }
      }
      else
        this.loggerService.error(this.lang.error.cannotCopyInvalid, { invokeAlert: true, alertTimeout: 3000 });
    }

    private testForm() {
      let config = this.userForm.value as UserConfiguration;
      config.parserId = this.configurationIndex === -1 ? 'UNSAVED SO NO ID' : this.parsersService.getParserId(this.configurationIndex);
      let successData: string = '';
      let errorData: string = '';

      let logError = () => {
        if (errorData)
          this.loggerService.error(errorData);
        errorData = '';
      };
      let logSuccess = () => {
        if (successData)
          this.loggerService.success(successData);
        successData = '';
      };

      let success = (data: string) => {
        logError();
        if (successData)
          successData += '\r\n';
        successData += data;
      };
      let error = (data: string) => {
        logSuccess();
        if (errorData)
          errorData += '\r\n';
        errorData += data;
      };

      if (this.parsersService.isConfigurationValid(config)) {
        if (this.appSettings.clearLogOnTest) {
          this.loggerService.clearLog();
        }
        success('Parser ID: '.concat(config.parserId));
        success('');
        this.parsersService.executeFileParser(config).then((dataArray) => {
          if (dataArray.parsedData.parsedConfigs.length > 0) {
            let data = dataArray.parsedData.parsedConfigs[0];
            let totalLength = data.files.length + data.failed.length + data.excluded.length;

            if (data.foundUserAccounts.length > 0) {
              this.loggerService.info('');
              success(this.lang.success.foundAccounts__i.interpolate({ count: data.foundUserAccounts.length }));
              for (let i = 0; i < data.foundUserAccounts.length; i++) {
                success(this.lang.success.foundAccountInfo__i.interpolate({
                  name: data.foundUserAccounts[i].name,
                  steamID64: data.foundUserAccounts[i].steamID64,
                  accountID: data.foundUserAccounts[i].accountID
                }));
              }
            }
            if (data.missingUserAccounts.length > 0) {
              logSuccess();
              this.loggerService.info('');
              error(this.lang.error.missingAccounts__i.interpolate({ count: data.missingUserAccounts.length }));
              for (let i = 0; i < data.missingUserAccounts.length; i++) {
                error(this.lang.error.missingAccountInfo__i.interpolate({ name: data.missingUserAccounts[i] }));
              }
            }

            if (dataArray.parsedData.noUserAccounts) {
              logError();
              this.loggerService.info('');
              error(this.lang.error.noAccountsWarning);
            }

            logSuccess();
            logError();
            this.loggerService.info('');
            success('');
            success('Number of Titles: '.concat(data.files.length.toString()));
            for (let i = 0; i < data.files.length; i++) {
              success('');
              let executableLocation = data.files[i].modifiedExecutableLocation;
              let title = data.files[i].finalTitle;
              let shortAppId = undefined; let appId = undefined;
              if(config.parserType !== 'Steam') {
                shortAppId = steam.generateShortAppId(executableLocation, title);
                appId = steam.lengthenAppId(shortAppId);
              } else {
                shortAppId = executableLocation.replace(/\"/g,"");
                appId = steam.lengthenAppId(shortAppId);
              }
              success(this.lang.success.appId__i.interpolate({
                index: i + 1,
                total: totalLength,
                appid: appId
              }));
              success(this.lang.success.shortAppId__i.interpolate({
                index: i + 1,
                total: totalLength,
                appid: shortAppId
              }));
              success(this.lang.success.extractedTitle__i.interpolate({
                index: i + 1,
                total: totalLength,
                title: data.files[i].extractedTitle
              }));
              success(this.lang.success.fuzzyTitle__i.interpolate({
                index: i + 1,
                total: totalLength,
                title: data.files[i].fuzzyTitle
              }));
              success(this.lang.success.finalTitle__i.interpolate({
                index: i + 1,
                total: totalLength,
                title: data.files[i].finalTitle
              }));
              success(this.lang.success.filePath__i.interpolate({
                index: i + 1,
                total: totalLength,
                filePath: data.files[i].filePath
              }));
              success(this.lang.success.startDir__i.interpolate({
                index: i + 1,
                total: totalLength,
                startDir: data.files[i].startInDirectory
              }));
              success(this.lang.success.completeShortcut__i.interpolate({
                index: i + 1,
                total: totalLength,
                shortcut: `${data.files[i].modifiedExecutableLocation} ${data.files[i].argumentString}`.trim()
              }));
              if (data.files[i].steamCategories.length > 0) {
                success(this.lang.success.steamCategory__i.interpolate({
                  index: i + 1,
                  total: totalLength,
                  steamCategory: data.files[i].steamCategories[0]
                }));
                for (let j = 1; j < data.files[i].steamCategories.length; j++) {
                  success(this.lang.success.steamCategoryInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    steamCategory: data.files[i].steamCategories[j]
                  }));
                }
              }
              if (data.files[i].onlineImageQueries.length) {
                success(this.lang.success.firstImageQuery__i.interpolate({
                  index: i + 1,
                  total: totalLength,
                  query: data.files[i].onlineImageQueries[0]
                }));
                for (let j = 1; j < data.files[i].onlineImageQueries.length; j++) {
                  success(this.lang.success.imageQueries__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    query: data.files[i].onlineImageQueries[j]
                  }));
                }
              }
              if (data.files[i].resolvedDefaultImages.length) {
                success(this.lang.success.resolvedDefaultImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedDefaultImages.length; j++) {
                  success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedDefaultImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedDefaultTallImages.length) {
                success(this.lang.success.resolvedDefaultTallImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedDefaultTallImages.length; j++) {
                  success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedDefaultTallImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedDefaultHeroImages.length) {
                success(this.lang.success.resolvedDefaultHeroImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedDefaultHeroImages.length; j++) {
                  success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedDefaultHeroImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedDefaultLogoImages.length) {
                success(this.lang.success.resolvedDefaultLogoImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedDefaultLogoImages.length; j++) {
                  success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedDefaultLogoImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedDefaultIcons.length) {
                success(this.lang.success.resolvedDefaultIconGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedDefaultIcons.length; j++) {
                  success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedDefaultIcons[j]
                  }));
                }
              }
              if (data.files[i].defaultImage !== undefined) {
                success(this.lang.success.defaultImageResolved__i.interpolate({
                  index: i + 1,
                  total: totalLength,
                  image: data.files[i].defaultImage
                }));
              }
              if (data.files[i].defaultTallImage !== undefined) {
                success(this.lang.success.defaultTallImageResolved__i.interpolate({
                  index: i+1,
                  total: totalLength,
                  image: data.files[i].defaultTallImage
                }));
              }
              if (data.files[i].defaultHeroImage !== undefined) {
                success(this.lang.success.defaultHeroImageResolved__i.interpolate({
                  index: i+1,
                  total: totalLength,
                  image: data.files[i].defaultHeroImage
                }));
              }
              if (data.files[i].defaultLogoImage !== undefined) {
                success(this.lang.success.defaultLogoImageResolved__i.interpolate({
                  index: i+1,
                  total: totalLength,
                  image: data.files[i].defaultLogoImage
                }));
              }
              if (data.files[i].defaultIcon !== undefined) {
                success(this.lang.success.defaultLogoImageResolved__i.interpolate({
                  index: i+1,
                  total: totalLength,
                  image: data.files[i].defaultIcon
                }));
              }


              if (data.files[i].resolvedLocalImages.length) {
                success(this.lang.success.resolvedImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedLocalImages.length; j++) {
                  success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedLocalImages[j]
                  }));
                }
              }
              if (data.files[i].localImages.length) {
                success(this.lang.success.localImagesResolved__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].localImages.length; j++) {
                  success(this.lang.success.localImageInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    image: data.files[i].localImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedLocalTallImages.length) {
                success(this.lang.success.resolvedTallImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedLocalTallImages.length; j++) {
                  success(this.lang.success.resolvedTallImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedLocalTallImages[j]
                  }));
                }
              }
              if (data.files[i].localTallImages.length) {
                success(this.lang.success.localTallImagesResolved__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].localTallImages.length; j++) {
                  success(this.lang.success.localTallImageInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    image: data.files[i].localTallImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedLocalHeroImages.length) {
                success(this.lang.success.resolvedHeroImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedLocalHeroImages.length; j++) {
                  success(this.lang.success.resolvedHeroImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedLocalHeroImages[j]
                  }));
                }
              }
              if (data.files[i].localHeroImages.length) {
                success(this.lang.success.localHeroImagesResolved__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].localHeroImages.length; j++) {
                  success(this.lang.success.localHeroImageInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    image: data.files[i].localHeroImages[j]
                  }));
                }
              }
              if (data.files[i].resolvedLocalLogoImages.length) {
                success(this.lang.success.resolvedLogoImageGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedLocalLogoImages.length; j++) {
                  success(this.lang.success.resolvedLogoImageGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedLocalLogoImages[j]
                  }));
                }
              }
              if (data.files[i].localLogoImages.length) {
                success(this.lang.success.localLogoImagesResolved__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].localLogoImages.length; j++) {
                  success(this.lang.success.localLogoImageInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    image: data.files[i].localLogoImages[j]
                  }));
                }
              }

              if (data.files[i].resolvedLocalIcons.length) {
                success(this.lang.success.resolvedIconGlob__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].resolvedLocalIcons.length; j++) {
                  success(this.lang.success.resolvedIconGlobInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    glob: data.files[i].resolvedLocalIcons[j]
                  }));
                }
              }
              if (data.files[i].localIcons.length) {
                success(this.lang.success.localIconsResolved__i.interpolate({
                  index: i + 1,
                  total: totalLength
                }));
                for (let j = 0; j < data.files[i].localIcons.length; j++) {
                  success(this.lang.success.localIconInfo__i.interpolate({
                    index: i + 1,
                    total: totalLength,
                    icon: data.files[i].localIcons[j]
                  }));
                }
              }
            }
            logSuccess();
            if (data.failed.length > 0) {
              this.loggerService.info('');
              error(this.lang.error.failedToMatch);
              for (let i = 0; i < data.failed.length; i++) {
                error(this.lang.error.failedFileInfo__i.interpolate({
                  index: data.files.length + i + 1,
                  total: totalLength,
                  filename: data.failed[i]
                }));
              }
            }
            if(data.excluded.length > 0) {
              this.loggerService.info('');
              this.loggerService.info(this.lang.info.userExclusions);
              for(let i=0; i < data.excluded.length; i++) {
                this.loggerService.info(this.lang.info.excludedFileInfo__i.interpolate({
                  index: data.files.length+ data.failed.length + i + 1,
                  total: totalLength,
                  filename: data.excluded[i]
                }));
              }
            }
            logError();
          }
          else {
            this.loggerService.info('');
            this.loggerService.info(this.lang.info.nothingWasFound);
          }
          this.loggerService.info('');
          this.loggerService.info(this.lang.info.testCompleted);
        }).catch((error) => {
          this.loggerService.error(this.lang.error.testFailed);
          this.loggerService.error(error);
        });
        this.loggerService.info(this.lang.info.testStarting__i.interpolate({
          title: config.configTitle || this.lang.text.noTitle,
          version: APP.version,
          portable: APP.srmdir ? "Portable" : "Non-Portable"
        }));
        this.loggerService.info(this.lang.info.opSys__i.interpolate({
          os: APP.os
        }))
        this.router.navigateByUrl('/logger');
      }
      else {
        this.loggerService.error(this.lang.error.cannotTestInvalid, { invokeAlert: true, alertTimeout: 3000 });
      }
    }

    private moveUp() {
      if (this.configurationIndex > 0) {
        this.parsersService.swapIndex(this.configurationIndex, this.configurationIndex - 1);
        this.router.navigate(['/parsers', this.configurationIndex - 1]);
      }
    }

    private moveDown() {
      if (this.configurationIndex + 1 < this.userConfigurations.length) {
        this.parsersService.swapIndex(this.configurationIndex, this.configurationIndex + 1);
        this.router.navigate(['/parsers', this.configurationIndex + 1]);
      }
    }

    private undoChanges() {
      this.parsersService.setCurrentConfiguration(this.configurationIndex, null);
    }

    private loadConfiguration() {
      if (this.configurationIndex !== -1 && this.userConfigurations.length > this.configurationIndex) {
        let config = this.userConfigurations[this.configurationIndex];
        this.formChanges.unsubscribe();
        this.userForm.patchValue(config.current ? config.current : config.saved);
        this.markAsDirtyDeep(this.userForm);

        this.isUnsaved = config.current != null;

        this.formChanges = this.userForm.valueChanges.subscribe((data: UserConfiguration) => {
          if (config.current == null)
            this.parsersService.setCurrentConfiguration(this.configurationIndex, data);
          else
            config.current = data;
        });
        this.loadedIndex = this.configurationIndex;
      }
      else if (this.configurationIndex === -1 && this.userConfigurations !== undefined) {
        this.formChanges.unsubscribe();
        this.userForm.patchValue(this.parsersService.getDefaultValues());
        this.userForm.markAsPristine();
        this.loadedIndex = -1;
      }
      else {
        this.loadedIndex = null;
      }

      this.changeRef.detectChanges();
    }

    private markAsDirtyDeep(control: AbstractControl): void {
      control.markAsDirty();
      if (control['controls'] !== undefined) {
        for (let childKey in control['controls']) {
          this.markAsDirtyDeep(control['controls'][childKey]);
        }
      }
    }

    ngOnDestroy() {
      this.subscriptions.unsubscribe();
      this.formChanges.unsubscribe();
    }
}
