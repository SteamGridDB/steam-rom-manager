import { Component } from '@angular/core';
import { gApp } from "../app.global";

@Component({
    selector: 'about',
    template: `
        <markdown [content]="lang.info__md.join('')"></markdown>
    `,
    styleUrls: ['../styles/about.component.scss']
})
export class AboutComponent {
    private get lang(){
        return gApp.lang.about.component;
    }
}