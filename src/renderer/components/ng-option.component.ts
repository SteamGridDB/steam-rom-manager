import { Component, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'ng-option',
  template: `
        <ng-content></ng-content>
    `,
  styleUrls: [
    '../styles/ng-option.component.scss'
  ],
  host: {
    '[class.selected]': 'isSelected',
    '[class.hidden]': 'isHidden'
  }
})
export class NgOptionComponent {
  @Input() displayValue: string;
  @Input() isSelected: boolean = false;
  @Input() isHidden: boolean = false;
  // @Input() selectOnClick: ()=>void
  constructor(private element: ElementRef) {

  }

  // @HostListener('click')
  // onClick() {
  //   this.selectOnClick();
  // }

  ngAfterViewChecked() {

  }

  ngOnDestroy() {

  }
}
