import { Directive, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { debounce } from "lodash";
import { ArtworkType, initArtworkRecord } from '../../models';

@Directive({
  selector: '[ng-inview]'
})
export class InViewDirective implements OnInit, OnDestroy {
  @Input() parentSelector: string;
  @Input() margin: number;
  @Input() artworkType: ArtworkType;
  @Input() inViewDict: {[appId: string]: Record<ArtworkType,boolean>}
  @Input() appId: string;
  //@Output() inView = new EventEmitter<{inView: boolean, target: ElementRef}>();

  private parentElement: HTMLElement;
  private parentRect: DOMRect; 
  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.parentElement = this.getParentElement();
    if (this.parentElement && (!this.inViewDict[this.appId]||!this.inViewDict[this.appId][this.artworkType])) {
      this.parentElement.addEventListener('scroll', this.onParentScroll);
      this.parentRect = this.parentElement.getBoundingClientRect();
      this.checkInView();
    }
  }

  ngOnDestroy() {
    if (this.parentElement) {
      this.parentElement.removeEventListener('scroll', this.onParentScroll);
    }
  }

  private getParentElement(): HTMLElement {
    if (this.parentSelector) {
      return document.querySelector(this.parentSelector);
    } else {
      return this.el.nativeElement.parentElement;
    }
  }

  private onParentScroll = debounce(() => {
    this.checkInView();
  }, 200);

  private checkInView() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const inView = (
      rect.top >= this.parentRect.top - this.margin &&
      rect.bottom <= this.parentRect.bottom + this.margin
      //&& rect.left >= parentRect.left &&
      //rect.right <= parentRect.right
    );
    //this.inView.emit({inView: inView, target: this.el});
    if(inView) {
        if(!this.inViewDict[this.appId]) {this.inViewDict[this.appId]= initArtworkRecord<boolean>(()=>false)}
        this.inViewDict[this.appId][this.artworkType] = true;
        this.parentElement.removeEventListener('scroll', this.onParentScroll)
    }
  }
}
