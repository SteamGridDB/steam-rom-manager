import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Input, ViewChild, forwardRef } from '@angular/core';
import { RecursiveFormComponent } from "../components";
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { ParsersService, LoggerService, ImageProviderService } from '../services';
import { UserConfiguration, RecursiveForm, RecursiveFormElement } from '../models';
import { Subscription } from "rxjs";
import { gApp } from "../app.global";

@Component({
    selector: 'parsers',
    template: `
        <markdown class="docs" [content]="this.currentDoc.content"></markdown>
        <ng-recursive-form class="recursiveForm" [userFormTemplate]="userFormTemplate" [hideErrors]="hideErrors"></ng-recursive-form>
        <div class="menu" drag-scroll>
            <ng-container *ngIf="configurationIndex === -1; else moreOptions">
                <div (click)="saveForm()">{{lang.buttons.save}}</div>
                <div style="margin: 0 0 0 auto;" (click)="openFAQ()">{{lang.buttons.faq}}</div>
            </ng-container>
            <ng-template #moreOptions>
                <div (click)="updateForm()">{{lang.buttons.save}}</div>
                <div (click)="saveForm()">{{lang.buttons.copy}}</div>
                <div (click)="testForm()">{{lang.buttons.testParser}}</div>
                <div class="dangerousButton" (click)="deleteForm()">{{lang.buttons.delete}}</div>
                <div [class.disabled]="configurationIndex === 0" (click)="moveUp()">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 300 300" height="1em">
                        <path d="M150 10 l 140 150 h -80 v 120 h -120 v -120 h -80 z" stroke="black" stroke-width="3" />
                    </svg>
                    {{lang.buttons.moveUp}}
                </div>
                <div [class.disabled]="configurationIndex + 1 === userConfigurations.length" (click)="moveDown()">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 300 300" height="1em">
                        <path d="M150 290 l 140 -150 h -80 v -120 h -120 v 120 h -80 z" stroke="black" stroke-width="3" />
                    </svg>
                    {{lang.buttons.moveDown}}
                </div>
                <div style="margin: 0 0 0 auto;" (click)="openFAQ()">{{lang.buttons.faq}}</div>
            </ng-template>
        </div>
    `,
    styleUrls: [
        '../styles/parsers.component.scss'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParsersComponent implements OnInit, OnDestroy {
    private currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
    private userFormTemplate: RecursiveForm = undefined;
    private hideErrors: boolean;
    private subscriptions: Subscription = new Subscription();
    private userConfigurations: UserConfiguration[] = [];
    private configurationIndex: number = -1;
    @ViewChild(forwardRef(() => RecursiveFormComponent)) private recursiveForm: RecursiveFormComponent;

    constructor(private parsersService: ParsersService, private loggerService: LoggerService, private imageProviderService: ImageProviderService, private router: Router, private activatedRoute: ActivatedRoute, private changeRef: ChangeDetectorRef) {
        this.userFormTemplate = {
            parserType: new RecursiveFormElement.Select({
                value: null,
                label: this.lang.label.parserType,
                placeholder: this.lang.placeholder.parserType,
                values: this.parsersService.getAvailableParsers().map((parser) => { return { display: parser }; }),
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    let parser = this.parsersService.getParser(self.value);
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = parser ? parser.info : this.lang.docs__md.parserType.join('');
                },
                onChange: (self, path) => {
                    let completePath = path.join();
                    if (this.currentDoc.activePath === completePath) {
                        let parser = this.parsersService.getParser(self.value);
                        this.currentDoc.content = parser ? parser.info : this.lang.docs__md.parserType.join('');
                    }
                    return false;
                }
            }),
            configTitle: new RecursiveFormElement.Input({
                value: '',
                label: this.lang.label.configTitle,
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.configTitle.join('');
                }
            }),
            steamCategory: new RecursiveFormElement.Input({
                value: '',
                hidden: () => !this.userFormTemplate.advanced['value'],
                label: this.lang.label.steamCategory,
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.steamCategory.join('');
                }
            }),
            executableLocation: new RecursiveFormElement.Path({
                value: '',
                label: this.lang.label.executableLocation,
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.executableLocation.join('');
                }
            }),
            romDirectory: new RecursiveFormElement.Path({
                value: '',
                directory: true,
                label: this.lang.label.romDirectory,
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.romDirectory.join('');
                }
            }),
            steamDirectory: new RecursiveFormElement.Path({
                value: '',
                directory: true,
                label: this.lang.label.steamDirectory,
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.steamDirectory.join('');
                }
            }),
            userAccounts: {
                specifiedAccounts: new RecursiveFormElement.Input({
                    value: '',
                    hidden: () => !this.userFormTemplate.advanced['value'],
                    label: this.lang.label.userAccounts,
                    onValidate: (self, path) => this.parsersService.validate(path[path.length - 1] as keyof UserConfiguration, self.value),
                    onInfoClick: (self, path) => {
                        this.currentDoc.activePath = path.join();
                        this.currentDoc.content = this.lang.docs__md.userAccounts.join('');
                    }
                }),
                skipWithMissingDataDir: new RecursiveFormElement.Toggle({
                    value: false,
                    hidden: () => !this.userFormTemplate.advanced['value'],
                    text: this.lang.text.skipWithMissingDataDir
                }),
                useCredentials: new RecursiveFormElement.Toggle({
                    value: true,
                    hidden: () => !this.userFormTemplate.advanced['value'],
                    text: this.lang.text.useCredentials
                })
            },
            parserInputs: (() => {
                let parserInputs = {};
                let parsers = this.parsersService.getAvailableParsers();

                for (let i = 0; i < parsers.length; i++) {
                    let parser = this.parsersService.getParser(parsers[i]);
                    if (parser && parser.inputs !== undefined) {
                        for (let inputFieldName in parser.inputs) {
                            let input = parser.inputs[inputFieldName];
                            parserInputs[inputFieldName] = new RecursiveFormElement.Input({
                                value: input.forcedInput !== undefined ? input.forcedInput : '',
                                label: input.label,
                                disabled: () => input.forcedInput !== undefined || this.userFormTemplate.parserType['value'] !== parsers[i],
                                hidden: () => this.userFormTemplate.parserType['value'] !== parsers[i],
                                onValidate: (self, path: string[]) =>
                                    this.parsersService.validate(path[0] as keyof UserConfiguration, { parser: parsers[i], input: inputFieldName, inputData: self.value }),
                                onInfoClick: (self, path) => {
                                    this.currentDoc.activePath = path.join();
                                    this.currentDoc.content = input.info;
                                }
                            });
                        }
                    }
                }

                return parserInputs;
            })(),
            titleModifier: new RecursiveFormElement.Input({
                value: '',
                hidden: () => !this.userFormTemplate.advanced['value'],
                label: this.lang.label.titleModifier,
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.titleModifier.join('');
                }
            }),
            fuzzyMatch: {
                use: new RecursiveFormElement.Toggle({
                    label: this.lang.label.fuzzyMatch,
                    value: true,
                    hidden: () => !this.userFormTemplate.advanced['value'],
                    text: this.lang.text.fuzzy_use,
                    onInfoClick: (self, path) => {
                        this.currentDoc.activePath = path.join();
                        this.currentDoc.content = this.lang.docs__md.fuzzyMatch.join('');
                    }
                }),
                removeCharacters: new RecursiveFormElement.Toggle({
                    value: true,
                    hidden: () => !this.userFormTemplate.advanced['value'],
                    text: this.lang.text.fuzzy_removeCharacters
                }),
                removeBrackets: new RecursiveFormElement.Toggle({
                    value: true,
                    hidden: () => !this.userFormTemplate.advanced['value'],
                    text: this.lang.text.fuzzy_removeBrackets
                })
            },
            executableArgs: new RecursiveFormElement.Input({
                value: '',
                label: this.lang.label.executableArgs,
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.executableArgs.join('');
                }
            }),
            appendArgsToExecutable: new RecursiveFormElement.Toggle({
                value: false,
                hidden: () => !this.userFormTemplate.advanced['value'],
                text: this.lang.text.appendArgsToExecutable
            }),
            onlineImageQueries: new RecursiveFormElement.Input({
                value: '${${fuzzyTitle}}',
                label: this.lang.label.onlineImageQueries,
                hidden: () => !this.userFormTemplate.advanced['value'],
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.onlineImageQueries.join('');
                }
            }),
            imageProviders: new RecursiveFormElement.Select({
                value: null,
                label: this.lang.label.imageProviders,
                placeholder: this.lang.placeholder.imageProviders,
                multiple: true,
                values: this.imageProviderService.instance.getAvailableProviders().map((provider) => { return { display: provider }; }),
                onValidate: (self, path) => this.parsersService.validate(path[0] as keyof UserConfiguration, self.value),
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.imageProviders.join('');
                }
            }),
            localImages: new RecursiveFormElement.Input({
                value: '',
                hidden: () => !this.userFormTemplate.advanced['value'],
                label: this.lang.label.localImages,
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.localImages.join('');
                }
            }),
            localIcons: new RecursiveFormElement.Input({
                value: '',
                hidden: () => !this.userFormTemplate.advanced['value'],
                label: this.lang.label.localIcons,
                onInfoClick: (self, path) => {
                    this.currentDoc.activePath = path.join();
                    this.currentDoc.content = this.lang.docs__md.localIcons.join('');
                }
            }),
            disabled: new RecursiveFormElement.Toggle({
                value: false,
                text: this.lang.text.disabled
            }),
            advanced: new RecursiveFormElement.Toggle({
                value: false,
                text: this.lang.text.advanced
            })
        }
    }

    private get lang() {
        return gApp.lang.parsers.component;
    }

    ngOnInit() {
        this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((data) => {
            this.userConfigurations = data;
            this.loadConfiguration();
        })).add(this.activatedRoute.params.subscribe((params) => {
            this.configurationIndex = parseInt(params['index']);
            this.loadConfiguration();
        }));
        this.currentDoc.content = this.lang.docs__md.intro.join('');
    }

    private openFAQ() {
        this.currentDoc.activePath = '';
        this.currentDoc.content = this.lang.docs__md.faq.join('');
    }

    private saveForm() {
        this.parsersService.saveConfiguration(this.recursiveForm.getValues() as UserConfiguration);
        this.router.navigate(['/parsers', this.userConfigurations.length - 1]);
    }

    private updateForm() {
        this.parsersService.updateConfiguration(this.recursiveForm.getValues() as UserConfiguration, this.configurationIndex);
    }

    private deleteForm() {
        this.parsersService.deleteConfiguration(this.configurationIndex);
        if (this.configurationIndex >= this.userConfigurations.length)
            this.router.navigate(['/parsers', this.userConfigurations.length - 1]);
    }

    private testForm() {
        let config = this.recursiveForm.getValues() as UserConfiguration;
        if (this.parsersService.isConfigurationValid(config)) {
            this.parsersService.executeFileParser(config).then((dataArray) => {
                if (dataArray.parsedData.parsedConfigs.length > 0) {
                    let data = dataArray.parsedData.parsedConfigs[0];
                    let totalLength = data.files.length + data.failed.length;

                    if (data.foundUserAccounts.length > 0) {
                        this.loggerService.info('');
                        this.loggerService.success(this.lang.success.foundAccounts__i.interpolate({ count: data.foundUserAccounts.length }));
                        for (let i = 0; i < data.foundUserAccounts.length; i++) {
                            this.loggerService.success(this.lang.success.foundAccountInfo__i.interpolate({
                                name: data.foundUserAccounts[i].name,
                                steamID64: data.foundUserAccounts[i].steamID64,
                                accountID: data.foundUserAccounts[i].accountID
                            }));
                        }
                    }
                    if (data.missingUserAccounts.length > 0) {
                        this.loggerService.info('');
                        this.loggerService.error(this.lang.error.missingAccounts__i.interpolate({ count: data.missingUserAccounts.length }));
                        for (let i = 0; i < data.missingUserAccounts.length; i++) {
                            this.loggerService.error(this.lang.error.missingAccountInfo__i.interpolate({ name: data.missingUserAccounts[i] }));
                        }
                    }

                    if (dataArray.parsedData.noUserAccounts) {
                        this.loggerService.info('');
                        this.loggerService.error(this.lang.error.noAccountsWarning);
                    }

                    if (data.steamCategories.length > 0) {
                        this.loggerService.info('');
                        this.loggerService.success(this.lang.success.steamCategoriesResolved);
                        for (let i = 0; i < data.steamCategories.length; i++) {
                            this.loggerService.success(this.lang.success.steamCategoryInfo__i.interpolate({ steamCategory: data.steamCategories[i] }));
                        }
                    }

                    for (let i = 0; i < data.files.length; i++) {
                        this.loggerService.info('');
                        this.loggerService.success(this.lang.success.extractedTitle__i.interpolate({
                            index: i + 1,
                            total: totalLength,
                            title: data.files[i].extractedTitle
                        }));
                        this.loggerService.success(this.lang.success.fuzzyTitle__i.interpolate({
                            index: i + 1,
                            total: totalLength,
                            title: data.files[i].fuzzyTitle
                        }));
                        this.loggerService.success(this.lang.success.filePath__i.interpolate({
                            index: i + 1,
                            total: totalLength,
                            filePath: data.files[i].filePath
                        }));
                        this.loggerService.success(this.lang.success.completeShortcut__i.interpolate({
                            index: i + 1,
                            total: totalLength,
                            shortcut: `${data.files[i].executableLocation} ${data.files[i].argumentString}`
                        }));
                        if (data.files[i].onlineImageQueries.length) {
                            this.loggerService.success(this.lang.success.firstImageQuery__i.interpolate({
                                index: i + 1,
                                total: totalLength,
                                query: data.files[i].onlineImageQueries[0]
                            }));
                            for (let j = 1; j < data.files[i].onlineImageQueries.length; j++) {
                                this.loggerService.success(this.lang.success.imageQueries__i.interpolate({
                                    index: i + 1,
                                    total: totalLength,
                                    query: data.files[i].onlineImageQueries[j]
                                }));
                            }
                        }
                        if (data.files[i].resolvedLocalImages.length) {
                            this.loggerService.success(this.lang.success.resolvedImageGlob__i.interpolate({
                                index: i + 1,
                                total: totalLength
                            }));
                            for (let j = 0; j < data.files[i].resolvedLocalImages.length; j++) {
                                this.loggerService.success(this.lang.success.resolvedImageGlobInfo__i.interpolate({
                                    index: i + 1,
                                    total: totalLength,
                                    glob: data.files[i].resolvedLocalImages[j]
                                }));
                            }
                        }
                        if (data.files[i].localImages.length) {
                            this.loggerService.success(this.lang.success.localImagesResolved__i.interpolate({
                                index: i + 1,
                                total: totalLength
                            }));
                            for (let j = 0; j < data.files[i].localImages.length; j++) {
                                this.loggerService.success(this.lang.success.localImageInfo__i.interpolate({
                                    index: i + 1,
                                    total: totalLength,
                                    image: data.files[i].localImages[j]
                                }));
                            }
                        }
                        if (data.files[i].resolvedLocalIcons.length) {
                            this.loggerService.success(this.lang.success.resolvedIconGlob__i.interpolate({
                                index: i + 1,
                                total: totalLength
                            }));
                            for (let j = 0; j < data.files[i].resolvedLocalIcons.length; j++) {
                                this.loggerService.success(this.lang.success.resolvedIconGlobInfo__i.interpolate({
                                    index: i + 1,
                                    total: totalLength,
                                    glob: data.files[i].resolvedLocalIcons[j]
                                }));
                            }
                        }
                        if (data.files[i].localIcons.length) {
                            this.loggerService.success(this.lang.success.localIconsResolved__i.interpolate({
                                index: i + 1,
                                total: totalLength
                            }));
                            for (let j = 0; j < data.files[i].localIcons.length; j++) {
                                this.loggerService.success(this.lang.success.localIconInfo__i.interpolate({
                                    index: i + 1,
                                    total: totalLength,
                                    icon: data.files[i].localIcons[j]
                                }));
                            }
                        }
                    }
                    if (data.failed.length > 0) {
                        this.loggerService.info('');
                        this.loggerService.error(this.lang.error.failedToMatch);
                        for (let i = 0; i < data.failed.length; i++) {
                            this.loggerService.error(this.lang.error.failedFileInfo__i.interpolate({
                                index: data.files.length + i + 1,
                                total: totalLength,
                                filename: data.failed[i]
                            }));
                        }
                    }

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
                version: gApp.version
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

    private loadConfiguration() {
        if (this.configurationIndex !== -1 && this.userConfigurations.length > this.configurationIndex) {
            this.hideErrors = false;
            this.recursiveForm.setValues(this.userConfigurations[this.configurationIndex], false);
        }
        else if (this.configurationIndex === -1 && this.userConfigurations !== undefined) {
            this.hideErrors = null;
            this.recursiveForm.setValues(this.parsersService.getDefaultValues(), true);
        }

        this.changeRef.detectChanges();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }
}