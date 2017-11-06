import { Component } from '@angular/core';
import { APP } from '../../variables';

@Component({
    selector: 'about',
    template: `
        <markdown [content]="lang.info__md.join('')"></markdown>
    `,
    styleUrls: ['../styles/about.component.scss']
})
export class AboutComponent {
    private get lang(){
        return APP.lang.about.component;
    }
}