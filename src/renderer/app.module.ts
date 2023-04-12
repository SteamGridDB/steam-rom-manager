import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, APP_BASE_HREF } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';

import * as Components from './components';
import * as SvgComponents from './svg-components';
import * as Services from './services';
import * as Directives from './directives';
import * as Pipes from './pipes';
import * as Guards from './guards';
import { AppRoutes } from './app.routing';

function ngObjectsToArray(importObject: any) {
    let objectArray: any[] = [];
    for (let attribute in importObject) {
        if (typeof importObject[attribute] === 'function')
            objectArray.push(importObject[attribute]);
    }
    return objectArray;
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpModule,
        AppRoutes,
        FormsModule,
        ReactiveFormsModule,
        ColorPickerModule
    ],
    declarations: [].concat(
        ngObjectsToArray(Components),
        ngObjectsToArray(SvgComponents),
        ngObjectsToArray(Directives),
        ngObjectsToArray(Pipes)
    ),
    providers: [].concat(
        ngObjectsToArray(Services),
        ngObjectsToArray(Guards),
        { provide: APP_BASE_HREF, useValue: 'SRM' },
        DatePipe,
        Title
    ),
    bootstrap: [Components.AppComponent]
})
export class AppModule { }