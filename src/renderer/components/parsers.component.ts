import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { ParsersService, LoggerService } from '../services';
import { UserConfiguration } from '../models';
import { Subscription } from "rxjs";

@Component({
    selector: 'parsers',
    templateUrl: '../templates/parsers.component.html',
    styleUrls: [
        '../styles/parsers.component.scss'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParsersComponent implements OnInit, OnDestroy {
    private currentParserType: string;
    private myForm: FormGroup;
    private submitted: boolean;
    private currentIndex: number;
    private userConfigurations: UserConfiguration[];
    private availableParsers: string[];
    private parserInfo: string;
    private redirectIndex: number;
    private parserInputInfo: { [fieldName: string]: { label: string, info: string } };
    private subscriptions: Subscription = new Subscription();

    constructor(private parsersService: ParsersService, private loggerService: LoggerService, private formBuilder: FormBuilder,
        private router: Router, private activatedRoute: ActivatedRoute, private changeRef: ChangeDetectorRef) {
        this.availableParsers = this.parsersService.getAvailableParsers();
    }

    ngOnInit() {
        this.myForm = this.formBuilder.group({
            parserType: ['', (control: FormControl) => this.parserTypeValidation(control)],
            configTitle: ['', (control: FormControl) => this.genericValidation('validateConfigTitle', control)],
            steamCategory: ['', (control: FormControl) => this.genericValidation('validateSteamCategory', control)],
            executableLocation: ['', (control: FormControl) => this.genericValidation('validateExecutableLocation', control)],
            romDirectory: ['', (control: FormControl) => this.genericValidation('validateROMsDir', control)],
            steamDirectory: ['', (control: FormControl) => this.genericValidation('validateSteamDir', control)],
            executableArgs: ['', (control: FormControl) => this.genericValidation('validateExecutableArgs', control)],
            appendArgsToExecutable: [false],
            titleModifier: ['', (control: FormControl) => this.genericValidation('validateTitleModifier', control)],
            localImages: ['', (control: FormControl) => this.genericValidation('validateLocalImages', control)],
            fuzzyMatch: this.formBuilder.group({ use: true, removeCharacters: true, removeBrackets: true }),
            userAccounts: this.formBuilder.group({ skipWithMissingDataDir: false, specifiedAccounts: ['', (control: FormControl) => this.genericValidation('validateUserAccounts', control)] }),
            onlineImageQueries: ['', (control: FormControl) => this.genericValidation('validateOnlineImageQueries', control)],
            enabled: [true],
            advanced: [false],
            parserInputs: this.formBuilder.group({})
        });
        this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((data) => {
            this.userConfigurations = data;
            this.loadUserConfiguration();
        }));
        this.subscriptions.add(this.activatedRoute.params.subscribe((params) => {
            let indexParam = params['index'] ? parseInt(params['index']) : undefined;
            let length = this.parsersService.getUserConfigurationsArray().length;
            if (indexParam < 0 && this.redirectIndex !== undefined) {
                let index = this.redirectIndex < length ? this.redirectIndex : length - 1;
                this.redirectIndex = undefined;
                if (index > -1)
                    return this.router.navigate(['/parsers', index]);
            }

            this.currentIndex = indexParam < 0 ? undefined : indexParam;
            this.loadUserConfiguration();
        }));
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    save(config: UserConfiguration, isValid: boolean) {
        this.submitted = true;
        if (isValid) {
            this.parsersService.saveConfiguration(config);
            this.redirectToConfiguration(this.userConfigurations.length);
        }
    }

    testParser(config: UserConfiguration, isValid: boolean) {
        this.submitted = true;
        if (isValid) {
            this.parsersService.updateConfiguration(config, this.currentIndex);
            this.parsersService.executeFileParser(config).then((dataArray) => {
                let data = dataArray.parsedData[0];
                let totalLength = data.files.length + data.failed.length;

                if (data.foundUserAccounts.length > 0) {
                    this.loggerService.info('');
                    this.loggerService.success(`Found ${data.foundUserAccounts.length} available user account(-s):`);
                    for (let i = 0; i < data.foundUserAccounts.length; i++) {
                        this.loggerService.success(`  ${data.foundUserAccounts[i].name} (steamID64: ${data.foundUserAccounts[i].steamID64}, accountID: ${data.foundUserAccounts[i].accountID})`);
                    }
                }
                if (data.missingUserAccounts.length > 0) {
                    this.loggerService.info('');
                    this.loggerService.error(`Following ${data.missingUserAccounts.length} user account(-s) were not found (user must to login to Steam at least once):`);
                    for (let i = 0; i < data.missingUserAccounts.length; i++) {
                        this.loggerService.error(`  ${data.missingUserAccounts}`);
                    }
                }

                if (data.steamCategories.length > 0) {
                    this.loggerService.info('');
                    this.loggerService.success(`Resolved Steam categories:`);
                    for (let i = 0; i < data.steamCategories.length; i++) {
                        this.loggerService.success(`  ${data.steamCategories[i]}`);
                    }
                }

                for (let i = 0; i < data.files.length; i++) {
                    this.loggerService.info('');
                    this.loggerService.success(`[${i + 1}/${totalLength}]:               Title - ${data.files[i].extractedTitle}`);
                    this.loggerService.success(`[${i + 1}/${totalLength}]:         Fuzzy title - ${data.files[i].fuzzyTitle}`);
                    this.loggerService.success(`[${i + 1}/${totalLength}]:           File path - ${data.files[i].filePath}`);
                    this.loggerService.success(`[${i + 1}/${totalLength}]:   Complete shortcut - ${data.files[i].executableLocation} ${data.files[i].argumentString}`);
                    if (data.files[i].onlineImageQueries.length) {
                        this.loggerService.success(`[${i + 1}/${totalLength}]:       Image queries - ${data.files[i].onlineImageQueries[0]}`);
                        for (let j = 1; j < data.files[i].onlineImageQueries.length; j++) {
                            this.loggerService.success(`[${i + 1}/${totalLength}]:                       ${data.files[i].onlineImageQueries[j]}`);
                        }
                    }
                    if (data.files[i].resolvedLocalImages.length)
                        this.loggerService.success(`[${i + 1}/${totalLength}]: Resolved image glob - ${data.files[i].resolvedLocalImages}`);
                    if (data.files[i].localImages.length) {
                        this.loggerService.success(`[${i + 1}/${totalLength}]:    Resolved images:`);
                        for (let j = 0; j < data.files[i].localImages.length; j++) {
                            this.loggerService.success(`[${i + 1}/${totalLength}]:                       ${decodeURI(data.files[i].localImages[j])}`);
                        }
                    }
                }
                if (data.failed.length > 0) {
                    this.loggerService.info('');
                    this.loggerService.error('Failed to match:');
                    for (let i = 0; i < data.failed.length; i++) {
                        this.loggerService.error(`[${i + 1 + data.files.length}/${totalLength}]: ${data.failed[i]}`);
                    }
                }

                this.loggerService.info('');
                this.loggerService.info(`"${config.configTitle}" parser test is completed.`);
            }).catch((error) => {
                this.loggerService.error('Testing failed');
                this.loggerService.error(error);
            });
            this.loggerService.info(`Testing "${config.configTitle}" parser.`);
            this.router.navigateByUrl('/logger');
        }
    }

    update(config: UserConfiguration, isValid: boolean) {
        this.submitted = true;
        if (isValid) {
            this.parsersService.updateConfiguration(config, this.currentIndex);
        }
    }

    delete() {
        this.parsersService.deleteConfiguration(this.currentIndex);
        this.redirectToConfiguration(this.currentIndex);
    }

    moveUp() {
        if (this.currentIndex > 0) {
            this.parsersService.swapIndex(this.currentIndex, this.currentIndex - 1);
            this.redirectToConfiguration(this.currentIndex - 1);
        }
    }

    moveDown() {
        if (this.currentIndex + 1 < this.userConfigurations.length) {
            this.parsersService.swapIndex(this.currentIndex, this.currentIndex + 1);
            this.redirectToConfiguration(this.currentIndex + 1);
        }
    }

    private redirectToConfiguration(index?: number) {
        if (index !== undefined) {
            this.redirectIndex = index;
            this.router.navigate(['/parsers', -1]);
        }
        else {
            this.redirectIndex = undefined;
            this.router.navigate(['/parsers', -1]);
        }
    }

    private parserTypeValidation(control: FormControl) {
        let invalid = this.genericValidation('validateParser', control);
        if (invalid === null)
            this.updateParserInputsFields(control.value);
        return invalid;
    }

    private updateParserInputsFields(parserType: string) {
        let parser = this.parsersService.getParser(parserType);

        if (this.currentParserType !== parserType) {
            this.currentParserType = parserType;

            this.myForm.setControl('parserInputs', this.formBuilder.group({}));
            this.parserInfo = parser.info;
            this.parserInputInfo = {};
            let parserInputs = <FormGroup>this.myForm.controls['parserInputs'];

            if (parser.inputs !== undefined) {
                for (let inputFieldName in parser.inputs) {
                    let input = parser.inputs[inputFieldName];
                    this.parserInputInfo[inputFieldName] = { label: input.label, info: input.info };
                    parserInputs.setControl(inputFieldName, this.formBuilder.control(
                        {
                            value: input.forcedInput !== undefined ? input.forcedInput : '',
                            disabled: input.forcedInput !== undefined
                        },
                        (control: FormControl) => this.genericInputValidation(control, inputFieldName)
                    ));
                }
            }
        }
    }

    private genericInputValidation(control: FormControl, fieldName: string) {
        let invalid = this.parsersService.validateParserInput(this.myForm.controls['parserType'].value, fieldName, control.value);
        if (invalid === null)
            return null;
        else {
            return {
                valid: false,
                error: invalid
            }
        }
    }

    private genericValidation(methodName: string, control: FormControl) {
        let valid = this.parsersService[methodName](control.value);
        if (valid === null)
            return null;
        else {
            return {
                valid: false,
                error: valid
            }
        }
    }

    private changeExecutable(id: string, files: File[]) {
        if (files && files.length) {
            this.myForm.controls['executableLocation'].setValue(files[0].path);
        }
        this.clearInput(id);
    }

    private changeRomDirectory(id: string, files: File[]) {
        if (files && files.length) {
            this.myForm.controls['romDirectory'].setValue(files[0].path);
        }
        this.clearInput(id);
    }

    private changeSteamDirectory(id: string, files: File[]) {
        if (files && files.length) {
            this.myForm.controls['steamDirectory'].setValue(files[0].path);
        }
        this.clearInput(id);
    }

    private changeLocalImagesDirectory(id: string, files: File[]) {
        if (files && files.length) {
            this.myForm.controls['localImages'].setValue(files[0].path);
        }
        this.clearInput(id);
    }

    private simulateClick(id: string) {
        let el = document.getElementById(id);
        if (el)
            el.click();
    }

    private clearInput(id: string) {
        let el = document.getElementById(id);
        if (el)
            (<HTMLInputElement>el).value = null;
    }

    private loadUserConfiguration() {
        if (this.currentIndex !== undefined && this.currentIndex < this.userConfigurations.length) {
            let userValues = this.userConfigurations[this.currentIndex];

            let parser = this.parsersService.getParser(userValues['parserType']);
            if (parser && parser.inputs) {
                for (let inputName in parser.inputs) {
                    if (this.userConfigurations[this.currentIndex]['parserInputs'][inputName] === undefined) {
                        if (parser.inputs[inputName].forcedInput === undefined)
                            userValues['parserInputs'][inputName] = '';
                        else
                            userValues['parserInputs'][inputName] = parser.inputs[inputName].forcedInput;
                    }
                    else
                        userValues['parserInputs'][inputName] = this.userConfigurations[this.currentIndex]['parserInputs'][inputName];
                }
                this.updateParserInputsFields(userValues['parserType']);
            }
            else {
                userValues['parserType'] = '';
                this.myForm.setControl('parserInputs', this.formBuilder.group({}));
                this.currentParserType = undefined;
                this.parserInfo = undefined;
                this.parserInputInfo = {};
            }

            this.myForm.setValue(userValues);
            this.submitted = true;
            this.changeRef.detectChanges();
        }
        else {
            this.myForm.setControl('parserInputs', this.formBuilder.group({}));
            this.myForm.reset(this.parsersService.getDefaultValues());
            this.myForm.controls['parserType'].markAsPristine();
            this.submitted = false;
            this.currentParserType = undefined;
            this.parserInfo = undefined;
            this.parserInputInfo = {};
        }
    }
}