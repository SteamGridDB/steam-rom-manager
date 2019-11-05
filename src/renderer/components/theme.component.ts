import { Component, OnInit, ElementRef, QueryList, ViewChildren, ViewChild, ChangeDetectionStrategy, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DraggableDirective } from '../directives';
import { ThemeManager } from "../../lib";
import { LoggerService } from '../services';
import { Subscription } from "rxjs";
import * as paths from "../../paths";
import * as fs from 'fs-extra';
import * as path from 'path';

@Component({
    selector: 'theme',
    template: `
        <div [ng-draggable]="{ dragLimit: 'none' }" [class.loading]="stateVariables.loadingTheme">
            <div class="colorPickerContainer">
                <span class="colorPicker" [colorPicker]="currentColor" (colorPickerChange)="onColorChange($event)" [cpDialogDisplay]="'inline'" [cpOutputFormat]="'rgba'" [cpAlphaChannel]="'always'" [cpToggle]="showThemePicker"></span>
            </div>
            <div class="menu">
                <div class="themeContainer" [class.empty]="availableThemes.length === 0">
                    <div (click)="themeInput = themeName" text-scroll *ngFor="let themeName of availableThemes">
                        {{themeName}}
                    </div>
                </div>
                <div class="inputContainer">
                    <input [(ngModel)]="themeInput" placeholder="Theme title"/>
                </div>
                <div class="buttonContainer">
                    <div class="clickButton refresh" (click)="refreshThemes()">Refresh</div>
                    <div class="clickButton load" (click)="loadColorTheme(themeInput)">Load</div>
                    <div class="clickButton delete" (click)="deleteColorTheme(themeInput)">Delete</div>
                    <div class="clickButton save" (click)="saveColorRules(themeInput)">Save</div>
                    <div class="clickButton reset" (click)="resetColor()">Reset</div>
                    <div class="clickButton resetAll" (click)="resetAllColors()">Reset All</div>
                </div>
            </div>
            <div class="ruleContainer" *ngIf="!stateVariables.loadingTheme">
                <ng-container *ngFor="let rootStyle of themeManager.getColorRules() | keys">
                    <div (click)="selectKey(rootStyle)" [class.active]="selectedKey === rootStyle">
                        <span class="colorText">{{rootStyle}}</span><span class="colorSquare" [attr.data-key]="rootStyle" #colorSquare>&nbsp;</span>
                    </div>
                </ng-container>
            </div>
        </div>
    `,
    host: {
        '(window:keydown)': 'hotkeys($event)',
        '[style.display]': "(showThemePicker ? 'initial' : 'none')"
    },
    styleUrls: ['../styles/theme.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeComponent implements OnInit {
    private subscriptions: Subscription = new Subscription();
    private cssObserver: MutationObserver;
    private currentColor: string = "#000000";
    private selectedKey: string = undefined;
    private showThemePicker: boolean = false;
    private themeManager: ThemeManager = new ThemeManager();
    private stateVariables: { refreshingThemes: boolean, loadingTheme: boolean, savingTheme: boolean, deletingTheme: boolean } = {
        loadingTheme: false, refreshingThemes: false, savingTheme: false, deletingTheme: false
    };
    private availableThemes: string[] = [];
    @ViewChildren('colorSquare', { read: ElementRef }) colorSquares: QueryList<ElementRef>;
    @ViewChild(DraggableDirective) themePicker: DraggableDirective;
    @Input() themeInput: string;

    constructor(private loggerService: LoggerService, private changeRef: ChangeDetectorRef) { }

    private selectKey(key: string) {
        let colorValue = document.documentElement.style.getPropertyValue('--color-' + key);
        if (!colorValue)
            colorValue = this.themeManager.getColorRuleValue(key);
        this.currentColor = colorValue;
        this.selectedKey = key;
    }

    private refreshThemes() {
        if (!this.stateVariables.refreshingThemes) {
            this.stateVariables.refreshingThemes = true;
            this.themeManager.getAvailableThemes().then((themes) => {
                this.availableThemes = themes;
                this.stateVariables.refreshingThemes = false;
            }).catch((error) => {
                this.loggerService.error('Error encountered while refreshing theme list!', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
                this.loggerService.error(error);
                this.stateVariables.refreshingThemes = false;
            });
        }
        else {
            this.loggerService.info('Please wait until current refresh process is done.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
        }
    }

    private resetColor() {
        if (this.selectedKey !== undefined)
            this.onColorChange(this.themeManager.getColorRuleValue(this.selectedKey));
    }

    private resetAllColors() {
        document.documentElement.removeAttribute("style");
        this.selectedKey = undefined;
    }

    private onColorChange(color: string) {
        this.currentColor = color;
        if (this.selectedKey !== undefined)
            document.documentElement.style.setProperty('--color-' + this.selectedKey, color);
    }

    private deleteColorTheme(themeTitle: string) {
        if (!themeTitle)
            return this.loggerService.info('Enter theme title which you want to delete.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
        else if (!this.stateVariables.deletingTheme && !this.stateVariables.loadingTheme) {
            this.stateVariables.deletingTheme = true;

            this.themeManager.readThemeTitle(true).then((currentThemeTitle) => {
                if (currentThemeTitle === themeTitle) {
                    this.stateVariables.loadingTheme = true;
                    this.resetAllColors();
                    this.themeManager.removeInjectedColorRules();
                    return this.themeManager.saveThemeTitle('');
                }
            }).then(() => {
                return this.themeManager.deleteColorFile(themeTitle);
            }).then(() => {
                this.stateVariables.loadingTheme = false;
                this.stateVariables.deletingTheme = false;
                this.refreshThemes();

                this.loggerService.success(`"${themeTitle}" color theme deleted.`, { invokeAlert: true, alertTimeout: 3000 });
            }).catch((error) => {
                this.stateVariables.loadingTheme = false;
                this.stateVariables.deletingTheme = false;

                this.loggerService.error('Error encountered while deleting color theme!', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
                this.loggerService.error(error);
            });
        }
        else {
            this.loggerService.info('Please wait until user theme is deleted or loaded.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
        }
    }

    private loadColorTheme(themeTitle: string) {
        if (!themeTitle)
            return this.loggerService.info('Enter theme title in order to load.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
        else if (!this.stateVariables.loadingTheme && !this.stateVariables.deletingTheme) {
            if (this.availableThemes.indexOf(themeTitle) === -1)
                return this.loggerService.info(`Theme "${themeTitle}" is not available.`, { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });

            this.stateVariables.loadingTheme = true;

            this.themeManager.readFromColorFile(themeTitle, false).then(() => {
                return this.themeManager.saveThemeTitle(themeTitle);
            }).then(() => {
                this.themeManager.injectColorRules();
                this.resetAllColors();

                this.stateVariables.loadingTheme = false;
                this.loggerService.success(`"${themeTitle}" color theme loaded.`, { invokeAlert: true, alertTimeout: 3000 });
            }).catch((error) => {
                this.stateVariables.loadingTheme = false;
                this.loggerService.error('Error encountered while loading color theme!', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
                this.loggerService.error(error);
            });
        }
        else {
            this.loggerService.info('Please wait until user theme is loaded or deleted.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
        }
    }

    private saveColorRules(themeTitle: string) {
        if (!this.stateVariables.savingTheme) {
            if (process.env.NODE_ENV === 'production') {
                if (!themeTitle)
                    return this.loggerService.info('Enter theme title in order to save or overwrite.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });

                this.stateVariables.savingTheme = true;
                this.themeManager.updateValuesFromDOM();

                this.themeManager.saveToColorFile(themeTitle).then(() => {
                    return this.themeManager.saveThemeTitle(themeTitle);
                }).then(() => {
                    this.themeManager.injectColorRules();
                    this.resetAllColors();

                    this.stateVariables.savingTheme = false;
                    this.refreshThemes();

                    this.loggerService.success(`"${themeTitle}" color theme saved.`, { invokeAlert: true, alertTimeout: 3000 });
                }).catch((error) => {
                    this.stateVariables.savingTheme = false;

                    this.loggerService.error('Error encountered while saving user color configuration!', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
                    this.loggerService.error(error);
                });
            }
            else {
                this.stateVariables.savingTheme = true;
                this.themeManager.updateValuesFromDOM();

                this.themeManager.saveToDevColorFile().then(() => {
                    this.stateVariables.savingTheme = false;

                    this.loggerService.success('Dev color theme saved.', { invokeAlert: true, alertTimeout: 3000 });
                }).catch((error) => {
                    this.stateVariables.savingTheme = false;

                    this.loggerService.error('Error encountered while saving DEV configuration!', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
                    this.loggerService.error(error);
                });
            }
        }
        else {
            this.loggerService.info('Please wait until user theme is saved before saving a new one.', { doNotAppendToLog: true, invokeAlert: true, alertTimeout: 3000 });
        }
    }

    private hotkeys(event: KeyboardEvent) {
        if (this.themePicker && process.env.NODE_ENV !== 'production') {
            if (event.key === 'c' && event.altKey) {
                this.showThemePicker = !this.showThemePicker;
            }
            else if (event.key === 'r' && event.altKey) {
                this.themePicker.resetPosition();
            }
        }
    }

    private styleColorSquares(colorSquares: QueryList<ElementRef>) {
        if (colorSquares) {
            colorSquares.toArray().forEach((square) => {
                if (square.nativeElement) {
                    let el = <HTMLElement>square.nativeElement;
                    el.style.cssText = `background-color: var(--color-${el.getAttribute('data-key')});`;
                }
            });
        }
    }

    ngAfterViewInit() {
        this.styleColorSquares(this.colorSquares);
        this.subscriptions.add(this.colorSquares.changes.subscribe((colorSquares: QueryList<ElementRef>) => {
            this.styleColorSquares(colorSquares);
        }));

        this.cssObserver = new MutationObserver(mutations => {
            this.themeManager.readFromStylesheets(':root');
        });
        this.cssObserver.observe(document.head, { childList: true });
    }

    ngOnInit() {
        this.themeManager.readFromStylesheets(':root');
        this.refreshThemes();
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
        this.cssObserver.disconnect();
    }
}
