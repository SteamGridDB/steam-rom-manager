import { Directive, HostListener, ElementRef, OnDestroy } from "@angular/core";

@Directive({
  selector: "[text-scroll]",
})
export class TextScrollDirective implements OnDestroy {
  private element: HTMLElement;
  private intervalId: number;
  private textOverflow: string = undefined;

  constructor(private elementRef: ElementRef) {
    this.element = elementRef.nativeElement;
  }

  @HostListener("mouseenter") onMouseEnter() {
    if (this.canBeScrolled()) {
      this.clearInterval();
      if (this.textOverflow === undefined) {
        this.textOverflow = this.element.style.textOverflow;
        this.element.style.textOverflow = "inherit";
      }
      this.intervalId = window.setInterval(() => {
        if (
          this.element.scrollLeft <
          this.element.scrollWidth - this.element.clientWidth
        )
          this.element.scrollLeft++;
        else this.clearInterval();
      }, 10);
    }
  }

  @HostListener("mouseleave") onMouseLeave() {
    if (this.canBeScrolled()) {
      this.clearInterval();
      this.intervalId = window.setInterval(() => {
        if (this.element.scrollLeft > 0) this.element.scrollLeft--;
        else {
          this.clearInterval();
          this.element.style.textOverflow = this.textOverflow;
          this.textOverflow = undefined;
        }
      }, 10);
    }
  }

  canBeScrolled() {
    if (this.element)
      return this.element.offsetWidth < this.element.scrollWidth;
    return false;
  }

  ngOnDestroy() {
    this.clearInterval();
  }

  private clearInterval() {
    if (this.intervalId !== undefined) {
      window.clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
