import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';
import { DatePipe, APP_BASE_HREF } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';

import * as Components from './components';
import * as Services from './services';
import * as Directives from './directives';
import * as Pipes from './pipes';
import { AppRoutes } from './app.routing';

function importFunctionsToArray(importObject: any) {
    let objectArray = [];
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
        importFunctionsToArray(Components),
        importFunctionsToArray(Directives),
        importFunctionsToArray(Pipes)
    ),
    providers: [].concat(
        importFunctionsToArray(Services),
        { provide: APP_BASE_HREF, useValue: '/my/app' },
        DatePipe,
        Title
    ),
    bootstrap: [Components.AppComponent]
})
export class AppModule { }