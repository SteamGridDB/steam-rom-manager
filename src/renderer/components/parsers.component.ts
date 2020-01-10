import { VariableParser } from '../../lib';
import { clipboard } from 'electron';
import { Component, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { ParsersService, LoggerService, ImageProviderService, SettingsService, ConfigurationPresetsService } from '../services';
import { UserConfiguration, NestedFormElement, AppSettings, ConfigPresets } from '../../models';
import { Subscription, Observable } from "rxjs";
import { APP } from '../../variables';
@Component({
  selector: 'parsers',
  template: `
        <markdown class="docs" [content]="this.currentDoc.content"></markdown>
        <div class="nestedForm">
            <ng-select placeholder="Configuration presets" allowEmpty="true" emitOnly="false" ngModel (ngModelChange)="setPreset($event)">
                <ng-option text-scroll *ngFor="let value of configPresets | keys">
                    {{value}}
                </ng-option>
            </ng-select>
            <ng-nested-form (parentFormChange)="userForm = $event" [nestedGroup]="nestedGroup"></ng-nested-form>
        </div>
        <div class="menu" drag-scroll>
            <ng-container *ngIf="configurationIndex === -1; else moreOptions">
                <div (click)="saveForm()" style="margin-right: auto;">{{lang.buttons.save}}</div>
                <div *ngIf="(parsersService.getDeletedConfigurations() | async).length !== 0" (click)="restoreForm()">{{lang.buttons.undoDelete}}</div>
                <div (click)="openFAQ()">{{lang.buttons.faq}}</div>
            </ng-container>
            <ng-template #moreOptions>
                <div (click)="updateForm()">{{lang.buttons.save}}</div>
                <div (click)="saveForm()">{{lang.buttons.copy}}</div>
                <div (click)="testForm()">{{lang.buttons.testParser}}</div>
                <div class="dangerousButton" (click)="deleteForm()" style="margin-right: auto;">{{lang.buttons.delete}}</div>
                <div *ngIf="(parsersService.getDeletedConfigurations() | async).length !== 0" (click)="restoreForm()">{{lang.buttons.undoDelete}}</div>
                <div *ngIf="isUnsaved" (click)="undoChanges()">{{lang.buttons.undoChanges}}</div>
                <div (click)="toClipboard()" [title]="lang.buttons.toClipboard">
                    <svg copy-icon [title]="lang.buttons.toClipboard"></svg>
                </div>
                <div [class.disabled]="configurationIndex === 0" (click)="moveUp()" [title]="lang.buttons.moveUp">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 300 300" height="1em">
                        <path d="M150 10 l 140 150 h -80 v 120 h -120 v -120 h -80 z" stroke="black" stroke-width="3" />
                    </svg>
                </div>
                <div [class.disabled]="configurationIndex + 1 === userConfigurations.length" (click)="moveDown()" [title]="lang.buttons.moveDown">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 300 300" height="1em">
                        <path d="M150 290 l 140 -150 h -80 v -120 h -120 v 120 h -80 z" stroke="black" stroke-width="3" />
                    </svg>
                </div>
                <div (click)="openFAQ()">{{lang.buttons.faq}}</div>
            </ng-template>
        </div>
    `,
  styleUrls: [
    '../styles/parsers.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParsersComponent implements AfterViewInit, OnDestroy {
  private currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
  private subscriptions: Subscription = new Subscription();
  private userConfigurations: { saved: UserConfiguration, current: UserConfiguration }[] = [];
  private configurationIndex: number = -1;
  private loadedIndex: number = null;
  private isUnsaved: boolean = false;
  private appSettings: AppSettings;
  private vParser = new VariableParser({ left: '${', right: '}' });
  private configPresets: ConfigPresets = {};
  private nestedGroup: NestedFormElement.Group;
  private userForm: FormGroup;
  private formChanges: Subscription = new Subscription();

  constructor(
    private parsersService: ParsersService,
    private loggerService: LoggerService,
    private settingsService: SettingsService,
    private imageProviderService: ImageProviderService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private changeRef: ChangeDetectorRef,
    private cpService: ConfigurationPresetsService) {

    this.nestedGroup = new NestedFormElement.Group({
      children: {
        parserType: new NestedFormElement.Select({
          label: this.lang.label.parserType,
          placeholder: this.lang.placeholder.parserType,
          values: this.parsersService.getAvailableParsers().map((parser) => { return { display: parser }; }),
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
          label: this.lang.label.steamCategory,
          highlight: this.highlight.bind(this),
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.steamCategory.join('');
          }
        }),
        executableLocation: new NestedFormElement.Path({
          label: this.lang.label.executableLocation,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.executableLocation.join('');
          }
        }),
        executableModifier: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.executableModifier,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.executableModifier.join('');
          }
        }),
        romDirectory: new NestedFormElement.Path({
          directory: true,
          label: this.lang.label.romDirectory,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.romDirectory.join('');
          }
        }),
        steamDirectory: new NestedFormElement.Path({
          directory: true,
          label: this.lang.label.steamDirectory,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.steamDirectory.join('');
          }
        }),
        startInDirectory: new NestedFormElement.Path({
          directory: true,
          label: this.lang.label.startInDirectory,
          isHidden: () => this.isHiddenMode(),
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.startInDirectory.join('');
          }
        }),
        userAccounts: new NestedFormElement.Group({
          label: this.lang.label.userAccounts,
          isHidden: () => this.isHiddenMode(),
          children: {
            specifiedAccounts: new NestedFormElement.Input({
              highlight: this.highlight.bind(this),
              onValidate: (self, path) => this.parsersService.validate(path[path.length - 1] as keyof UserConfiguration, self.value)
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
        parserInputs: (() => {
          let parserInputs = {};
          let parsers = this.parsersService.getAvailableParsers();

          for (let i = 0; i < parsers.length; i++) {
            let parser = this.parsersService.getParserInfo(parsers[i]);
            if (parser && parser.inputs !== undefined) {
              for (let inputFieldName in parser.inputs) {
                let input = parser.inputs[inputFieldName];
                parserInputs[inputFieldName] = new NestedFormElement.Input({
                  initialValue: input.forcedInput !== undefined ? input.forcedInput : null,
                  highlight: this.highlight.bind(this),
                  label: input.label,
                  isHidden: () => {
                    return Observable.concat(Observable.of(this.userForm.get('parserType').value), this.userForm.get('parserType').valueChanges).map((type: string) => {
                      return type !== parsers[i];
                    });
                  },
                  onValidate: (self, path) => {
                    if (this.userForm.get('parserType').value === parsers[i])
                      return this.parsersService.validate(path[0] as keyof UserConfiguration, { parser: parsers[i], input: inputFieldName, inputData: self.value });
                    else
                      return null;
                  },
                  onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = input.info;
                  }
                });
              }
            }
          }

          return new NestedFormElement.Group({
            children: parserInputs
          });
        })(),

        titleFromVariable: new NestedFormElement.Group({
          isHidden: () => this.isHiddenMode(),
          label: this.lang.label.titleFromVariable,
          children: {
            limitToGroups: new NestedFormElement.Input({
              highlight: this.highlight.bind(this),
              onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value)
            }),
            shortcutPassthrough: new NestedFormElement.Toggle({
              text: this.lang.text.shortcut_passthrough
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
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.titleModifier,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.titleModifier.join('');
          }
        }),
        fuzzyMatch: new NestedFormElement.Group({
          isHidden: () => this.isHiddenMode(),
          label: this.lang.label.fuzzyMatch,
          children: {
            use: new NestedFormElement.Toggle({
              text: this.lang.text.fuzzy_use
            }),
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
        executableArgs: new NestedFormElement.Input({
          label: this.lang.label.executableArgs,
          highlight: this.highlight.bind(this),
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.executableArgs.join('');
          }
        }),
        appendArgsToExecutable: new NestedFormElement.Toggle({
          isHidden: () => this.isHiddenMode(),
          text: this.lang.text.appendArgsToExecutable
        }),
        onlineImageQueries: new NestedFormElement.Input({
          label: this.lang.label.onlineImageQueries,
          highlight: this.highlight.bind(this),
          isHidden: () => this.userForm.get('advanced').valueChanges.map(val => !val),
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.onlineImageQueries.join('');
          }
        }),
        imagePool: new NestedFormElement.Input({
          label: this.lang.label.imagePool,
          highlight: this.highlight.bind(this),
          isHidden: () => this.userForm.get('advanced').valueChanges.map(val => !val),
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.imagePool.join('');
          }
        }),
        imageProviders: new NestedFormElement.Select({
          label: this.lang.label.imageProviders,
          placeholder: this.lang.placeholder.imageProviders,
          multiple: true,
          allowEmpty: true,
          values: this.imageProviderService.instance.getAvailableProviders().map((provider) => { return { display: provider }; }),
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.imageProviders.join('');
          }
        }),
        defaultImage: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.defaultImage,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.defaultImage.join('');
          }
        }),
        defaultTallImage: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.defaultTallImage,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.defaultTallImage.join('');
          }
        }),
        defaultHeroImage: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.defaultHeroImage,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.defaultHeroImage.join('');
          }
        }),
        localImages: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.localImages,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.localImages.join('');
          }
        }),
        localTallImages: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.localTallImages,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.localTallImages.join('');
          }
        }),
        localHeroImages: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.localHeroImages,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.localHeroImages.join('');
          }
        }),

        localIcons: new NestedFormElement.Input({
          isHidden: () => this.isHiddenMode(),
          highlight: this.highlight.bind(this),
          label: this.lang.label.localIcons,
          onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
          onInfoClick: (self, path) => {
            this.currentDoc.activePath = path.join();
            this.currentDoc.content = this.lang.docs__md.localIcons.join('');
          }
        }),
        disabled: new NestedFormElement.Toggle({
          text: this.lang.text.disabled
        }),
        advanced: new NestedFormElement.Toggle({
          text: this.lang.text.advanced
        })
      }
    });
    this.currentDoc.content = this.lang.docs__md.intro.join('');
    this.appSettings = this.settingsService.getSettings();
  }

  ngAfterViewInit() {
    this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((data) => {
      this.userConfigurations = data;
      this.loadConfiguration();
    })).add(this.activatedRoute.params.subscribe((params) => {
      this.configurationIndex = parseInt(params['index']);
      this.loadConfiguration();
    })).add(this.cpService.dataObservable.subscribe((data) => {
      this.configPresets = data;
    }));
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

  private isHiddenMode() {
    return Observable.concat(Observable.of(this.userForm.get('advanced').value), this.userForm.get('advanced').valueChanges).map(val => !val);
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
      if (this.appSettings.clearLogOnTest)
        this.loggerService.clearLog();

      this.parsersService.executeFileParser(config).then((dataArray) => {
        if (dataArray.parsedData.parsedConfigs.length > 0) {
          let data = dataArray.parsedData.parsedConfigs[0];
          let totalLength = data.files.length + data.failed.length;

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

          for (let i = 0; i < data.files.length; i++) {
            success('');
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
        version: APP.version
      }));
      this.router.navigateByUrl('/logger');
    }
    else
      this.loggerService.error(this.lang.error.cannotTestInvalid, { invokeAlert: true, alertTimeout: 3000 });
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
