import { Component, ContentChildren, QueryList, ElementRef, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NavLinkComponent } from './nav-link.component';

@Component({
    selector: 'nav-expand',
    template: `
        <ng-content select=".title"></ng-content>
        <div class="items"><ng-content select=".item"></ng-content></div>
    `,
    styleUrls: ['../styles/nav-expand.component.scss'],
    host: { '[class.empty]': 'itemCount === 0' },
    encapsulation: ViewEncapsulation.None
})
export class NavExpandComponent implements OnDestroy {
    private itemCount: number = 0;
    private keepAlive: boolean = true;
    @ContentChildren(NavLinkComponent, { read: ElementRef }) children: QueryList<ElementRef>;

    ngAfterContentInit() {
        this.children.changes.takeWhile(() => this.keepAlive).subscribe((data: QueryList<ElementRef>) => {
            if (data) {
                this.itemCount = data.toArray().filter((dataItem) => {
                    return (<HTMLElement>dataItem.nativeElement).parentElement.classList.contains('items');
                }).length;
            }
            else
                this.itemCount = 0;
        });
    }

    ngOnDestroy() {
        this.keepAlive = false;
    }
}