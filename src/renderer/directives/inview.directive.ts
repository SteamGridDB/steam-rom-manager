import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { debounce } from "lodash";

@Directive({
  selector: '[ng-inview]'
})
export class InViewDirective implements OnInit, OnDestroy {
  @Input() childSelector: string;
  @Input() margin: number;
  @Input() inViewDict: {[inviewkey: string]: boolean}
  @Output() updateDOM: EventEmitter<void> = new EventEmitter();
  private checkInterval: NodeJS.Timeout;
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.el.nativeElement.addEventListener('scroll', debounce(() => this.checkInView(), 100))
    this.checkInterval = setInterval(()=>this.checkInView(), 500);
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('scroll', this.checkInView)
    clearInterval(this.checkInterval);
  }

  private getChildElements() {
    if(this.childSelector) {
      return this.el.nativeElement.querySelectorAll(this.childSelector);
    } else {
      return new NodeList() as NodeListOf<Element>;
    }
  }

  private checkInView() {
    const childElements = this.getChildElements();
    const scrollRect = this.el.nativeElement.getBoundingClientRect();
    childElements.forEach((childElement: Element) => {
      if(!this.inViewDict[childElement.getAttribute("data-inviewkey")]) {
        const childRect = childElement.getBoundingClientRect();
        const inView = (
          childRect.top >= scrollRect.top - this.margin &&
          childRect.bottom <= scrollRect.bottom + this.margin
        );
        if(inView) {
          this.inViewDict[childElement.getAttribute("data-inviewkey")] = true;
        }
      }
    })
    this.updateDOM.emit()
  }
}
