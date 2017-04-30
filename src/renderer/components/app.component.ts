import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app',
    template: `
        <titlebar></titlebar>
        <section>
            <nav></nav>
            <router-outlet></router-outlet>
        </section>
        <theme></theme>
        <alert></alert>
    `,
    styleUrls: ['../styles/app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent { }