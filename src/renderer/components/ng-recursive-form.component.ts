import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { NgRecursiveElement } from "../directives";
import { RecursiveForm, RecursiveFormElement } from "../models";
import * as _ from 'lodash';

@Component({
    selector: 'ng-recursive-form',
    template: `
        <ng-template #recursiveForm let-templateData="templateData" let-path="path">
            <ng-container *ngFor="let templateKey of templateData | keys">
                <ng-container *ngVar="templateData[templateKey] as item">
                    <ng-container [ngSwitch]="item.constructor.name">
                        <div class="container" *ngSwitchCase="'Select'" [hidden]="(item.hidden ? item.hidden() : false)">
                            <label *ngIf="item.label">
                                <svg class="infoButton" info-icon [hover]="true" *ngIf="item.onInfoClick" (click)="item.onInfoClick(item, ngRecEl.path)"></svg>
                                {{item.label}}
                            </label>
                            <ng-select [placeholder]="item.placeholder" [multiple]="item.multiple"
                                #ngModel=ngModel
                                #ngRecEl=ngRecEl
                                [ngModel]="item.value" 
                                [ngRecEl]="(path | arrayConcat: templateKey)"
                                [ngRecElItem]="item"
                            >
                                <ng-option *ngFor="let value of item.values" [ngValue]="value.real || value.display">
                                    {{value.display}}
                                </ng-option>
                            </ng-select>
                            <div class="errorMessage" [hidden]="!item.error || (ngModel.pristine && hideErrors !== false) || hideErrors === true">{{item.error}}</div>
                        </div>
                        <div class="container" *ngSwitchCase="'Input'" [hidden]="(item.hidden ? item.hidden() : false)">
                            <label *ngIf="item.label">
                                <svg class="infoButton" info-icon [hover]="true" *ngIf="item.onInfoClick" (click)="item.onInfoClick(item, ngRecEl.path)"></svg>
                                {{item.label}}
                            </label>
                            <input [placeholder]="item.placeholder || ''"
                                #ngModel=ngModel
                                #ngRecEl=ngRecEl
                                [ngModel]="item.value" 
                                [ngRecEl]="(path | arrayConcat: templateKey)"
                                [ngRecElItem]="item"
                                [disabled]="(item.disabled ? item.disabled() : false)"
                            />
                            <div class="errorMessage" [hidden]="!item.error || (ngModel.pristine && hideErrors !== false) || hideErrors === true">{{item.error}}</div>
                        </div>
                        <div class="container" *ngSwitchCase="'Path'" [hidden]="(item.hidden ? item.hidden() : false)">
                            <label *ngIf="item.label">
                                <svg class="infoButton" info-icon [hover]="true" *ngIf="item.onInfoClick" (click)="item.onInfoClick(item, ngRecEl.path)"></svg>
                                {{item.label}}
                            </label>
                            <input [placeholder]="item.placeholder || ''" 
                                #ngModel=ngModel
                                #ngRecEl=ngRecEl
                                [ngModel]="item.value" 
                                [ngRecEl]="(path | arrayConcat: templateKey)"
                                [ngRecElItem]="item"
                            />
                            <ng-path-input class="clickButton" [directory]="item.directory" ngModel (ngModelChange)="item.value = $event">Browse</ng-path-input>
                            <div class="errorMessage" [hidden]="!item.error || (ngModel.pristine && hideErrors !== false) || hideErrors === true">{{item.error}}</div>
                        </div>
                        <div class="container" *ngSwitchCase="'Toggle'" [hidden]="(item.hidden ? item.hidden() : false)">
                            <label *ngIf="item.label">
                                <svg class="infoButton" info-icon [hover]="true" *ngIf="item.onInfoClick" (click)="item.onInfoClick(item, ngRecEl.path)"></svg>
                                {{item.label}}
                            </label>
                            <ng-toggle-button
                                #ngModel=ngModel
                                #ngRecEl=ngRecEl
                                [ngModel]="item.value" 
                                [ngRecEl]="(path | arrayConcat: templateKey)"
                                [ngRecElItem]="item"
                            >{{item.text || ''}}</ng-toggle-button>
                            <div class="errorMessage" [hidden]="!item.error || (ngModel.pristine && hideErrors !== false) || hideErrors === true">{{item.error}}</div>
                        </div>
                        <ng-container *ngSwitchCase="'Object'">
                            <ng-container *ngIf="(item | keys)?.length > 0">
                                <ng-container *ngTemplateOutlet="recursiveForm; context: { templateData: item, path: (path | arrayConcat: templateKey) }"></ng-container>
                            </ng-container>
                        </ng-container>
                    </ng-container>
                </ng-container>
            </ng-container>
        </ng-template>
        <ng-container *ngTemplateOutlet="recursiveForm; context: { templateData: _userFormTemplate, path: [] }"></ng-container>
        <ng-template #infoButton>
            <svg class="infoButton" viewBox="0 0 300 300" height="1em" xmlns="http://www.w3.org/2000/svg" shape-rendering="auto">
                <circle cx="150" cy="150" r="145" style="fill: transparent; stroke-width: 15"/>
                <text text-anchor="middle" x="150" y="150" dy="0.35em" font-size="16em" font-family="'Roboto'">i</text>
            </svg>
        </ng-template>
    `,
    styleUrls: ['../styles/ng-recursive-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecursiveFormComponent {
    private _userFormTemplate: RecursiveForm = {};
    @Input() hideErrors: boolean;
    @ViewChildren(NgRecursiveElement) private recursiveElements: QueryList<NgRecursiveElement>;

    constructor(private changeRef: ChangeDetectorRef) { }

    @Input() set userFormTemplate(template: RecursiveForm) {
        this._userFormTemplate = template;
    }

    get userFormTemplate() {
        return this._userFormTemplate
    }

    setValues(valueTree: any, setAsNew: boolean, changeParams?: { [path: string]: any }) {
        if (this.recursiveElements && this.recursiveElements.length) {
            let elements: { [stringPath: string]: NgRecursiveElement } = {};
            let setValues = (treeRef: any, previousPath: string) => {
                for (let treeKey in treeRef) {
                    let currentPath = previousPath ? `${previousPath}.${treeKey}` : treeKey;
                    if (_.isPlainObject(treeRef[treeKey]))
                        setValues(treeRef[treeKey], currentPath);
                    else if (elements[currentPath] !== undefined) {
                        elements[currentPath].setValue(treeRef[treeKey], changeParams ? changeParams[currentPath] : undefined);
                        if (setAsNew)
                            elements[currentPath].resetStatus();
                    }
                }
            }

            this.recursiveElements.forEach((el) => {
                elements[el.getPath().join('.')] = el;
            });

            setValues(valueTree, null);
            this.changeRef.detectChanges();
        }
    }

    getValues() {
        let valueTree = {};
        if (this.recursiveElements) {
            this.recursiveElements.forEach((el) => {
                el.mergeValue(valueTree);
            });
        }
        return valueTree;
    }
}