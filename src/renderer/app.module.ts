import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, APP_BASE_HREF } from '@angular/common';
import { ColorPickerModule } from 'ngx-color-picker';
import { DynamicHTMLModule } from 'ng-dynamic';

import * as Components from './components';
import * as SvgComponents from './svg-components';
import * as Services from './services';
import * as Directives from './directives';
import * as Pipes from './pipes';
import * as Guards from './guards';
import { AppRoutes } from './app.routing';

function ngObjectsToArray(importObject: any, selector: boolean = false) {
    if (selector === true) {
        let objectArray: { component: any, selector: string }[] = [];
        for (let attribute in importObject) {
            if (typeof importObject[attribute] === 'function') {
                let metadata = Reflect.getMetadata('annotations', importObject[attribute]);
                for (let i = 0; i < metadata.length; i++) {
                    if (metadata[i].selector) {
                        objectArray.push({ component: importObject[attribute], selector: metadata[i].selector });
                        break;
                    }
                }
            }
        }
        return objectArray;
    }
    else {
        let objectArray: any[] = [];
        for (let attribute in importObject) {
            if (typeof importObject[attribute] === 'function')
                objectArray.push(importObject[attribute]);
        }
        return objectArray;
    }
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpModule,
        AppRoutes,
        FormsModule,
        ColorPickerModule,
        DynamicHTMLModule.forRoot({
            components: [].concat(
                ngObjectsToArray(SvgComponents, true)
            )
        })
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