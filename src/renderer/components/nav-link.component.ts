import { Component } from '@angular/core';

@Component({
    selector: 'nav-link',
    template: `
        <span class="content" text-scroll>
            <ng-content></ng-content>
        </span>
    `,
    styleUrls: ['../styles/nav-link.component.scss']
})
export class NavLinkComponent {}