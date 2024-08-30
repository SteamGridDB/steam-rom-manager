import {
  Directive,
  Input,
  HostListener,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
  ContentChildren,
  QueryList,
} from "@angular/core";
import { takeWhile } from "rxjs/operators";
type limitType = "none" | "parent" | "viewport";
type userOptionsType = {
  dragLimit?: limitType;
  enable?: boolean;
  dragArea?: boolean;
};

@Directive({
  selector: "[ng-draggable]",
})
export class DraggableDirective implements OnInit, OnDestroy, OnChanges {
  private keepSubscriptionAlive: boolean;
  private userSelect: string;
  private position: string;
  private dragging: boolean;
  private enabled: boolean;
  private isDragArea: boolean;
  private dragLimit: limitType;
  private positionProperties: {
    left: { value: string; priority: string };
    top: { value: string; priority: string };
    right: { value: string; priority: string };
    bottom: { value: string; priority: string };
  };
  private pos: {
    parent: {
      left: number;
      top: number;
      width: number;
      height: number;
      selfOffsetLeft: number;
      selfOffsetTop: number;
    };
    self: {
      left: number;
      top: number;
      width: number;
      height: number;
      mouseOffsetLeft: number;
      mouseOffsetTop: number;
    };
  };

  @Input("ng-draggable") private userOptions: userOptionsType;
  @ContentChildren(DraggableDirective)
  childrenDirectives: QueryList<DraggableDirective>;
  @ContentChildren("dragArea", { read: ElementRef })
  childrenDragAreas: QueryList<ElementRef>;
  redrawableChildren: DraggableDirective[];
  dragAreas: ElementRef[];

  constructor(private elementRef: ElementRef) {
    this.keepSubscriptionAlive = true;
    this.userSelect = undefined;
    this.position = undefined;
    this.dragging = false;
    this.enabled = true;
    this.isDragArea = true;
    this.dragLimit = "parent";
    this.positionProperties = undefined;
    this.redrawableChildren = [];
    this.dragAreas = [];
    this.pos = {
      parent: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        selfOffsetLeft: 0,
        selfOffsetTop: 0,
      },
      self: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        mouseOffsetLeft: 0,
        mouseOffsetTop: 0,
      },
    };
  }

  @HostListener("dragstart", ["$event"])
  private onDragStart(event: DragEvent) {
    if (this.dragging) return false;
  }

  @HostListener("mousedown", ["$event"])
  private onMousedown(event: MouseEvent) {
    if (this.enabled) {
      if (this.elementRef.nativeElement)
        this.updatePosData(true, event.clientX, event.clientY);
      if (this.canBeDragged(event.target)) this.toggleDrag(true);
    }
  }

  @HostListener("document:mouseup", ["$event"])
  private onMouseup(event: MouseEvent) {
    this.toggleDrag(false);
  }

  @HostListener("document:mousemove", ["$event"])
  private onMousemove(event: DragEvent) {
    if (this.dragging && this.elementRef.nativeElement) {
      this.updatePosData(false, event.clientX, event.clientY);
      this.savePosition();
      this.saveUserSelect();

      let el = <HTMLElement>this.elementRef.nativeElement;
      el.style.setProperty(
        "left",
        this.calculateX(event.clientX) + "px",
        "important",
      );
      el.style.setProperty(
        "top",
        this.calculateY(event.clientY) + "px",
        "important",
      );
      this.redrawChildren();
    }
  }

  private calculateX(mouseX: number) {
    let el = <HTMLElement>this.elementRef.nativeElement;
    let newLeft =
      mouseX -
      this.pos.parent.left -
      this.pos.parent.selfOffsetLeft -
      this.pos.self.mouseOffsetLeft;
    switch (this.dragLimit) {
      case "parent":
        return this.fitToLimits(
          0 - this.pos.parent.selfOffsetLeft,
          newLeft,
          this.pos.parent.width -
            this.pos.self.width -
            this.pos.parent.selfOffsetLeft,
        );
      case "viewport":
        return this.fitToLimits(
          0 - this.pos.parent.left - this.pos.parent.selfOffsetLeft,
          newLeft,
          window.innerWidth -
            this.pos.self.width -
            this.pos.parent.left -
            this.pos.parent.selfOffsetLeft,
        );
      default:
        return newLeft;
    }
  }

  private calculateY(mouseY: number) {
    let el = <HTMLElement>this.elementRef.nativeElement;
    let newTop =
      mouseY -
      this.pos.parent.top -
      this.pos.parent.selfOffsetTop -
      this.pos.self.mouseOffsetTop;
    switch (this.dragLimit) {
      case "parent":
        return this.fitToLimits(
          0 - this.pos.parent.selfOffsetTop,
          newTop,
          this.pos.parent.height -
            this.pos.self.height -
            this.pos.parent.selfOffsetTop,
        );
      case "viewport":
        return this.fitToLimits(
          0 - this.pos.parent.top - this.pos.parent.selfOffsetTop,
          newTop,
          window.innerHeight -
            this.pos.self.height -
            this.pos.parent.top -
            this.pos.parent.selfOffsetTop,
        );
      default:
        return newTop;
    }
  }

  private updatePosData(
    onMouseDown: boolean,
    mouseX?: number,
    mouseY?: number,
  ) {
    let el = <HTMLElement>this.elementRef.nativeElement;

    let rect = el.getBoundingClientRect();

    if (onMouseDown) {
      this.pos.self.left = rect.left;
      this.pos.self.top = rect.top;

      if (mouseX !== undefined)
        this.pos.self.mouseOffsetLeft = mouseX - rect.left;
      else this.pos.self.mouseOffsetLeft = 0;

      if (mouseY !== undefined)
        this.pos.self.mouseOffsetTop = mouseY - rect.top;
      else this.pos.self.mouseOffsetTop = 0;
    }
    this.pos.self.width = rect.width;
    this.pos.self.height = rect.height;

    if (el.parentElement) {
      let parentRect = el.parentElement.getBoundingClientRect();
      if (onMouseDown) {
        this.pos.parent.selfOffsetLeft =
          rect.left -
          parentRect.left -
          parseFloat(
            window.getComputedStyle(el, null).getPropertyValue("left"),
          );
        this.pos.parent.selfOffsetTop =
          rect.top -
          parentRect.top -
          parseFloat(window.getComputedStyle(el, null).getPropertyValue("top"));
      }
      this.pos.parent.left = parentRect.left;
      this.pos.parent.top = parentRect.top;
      this.pos.parent.width = parentRect.width;
      this.pos.parent.height = parentRect.height;
    } else {
      if (onMouseDown) {
        this.pos.parent.selfOffsetLeft = rect.left;
        this.pos.parent.selfOffsetLeft = rect.top;
      }
      this.pos.parent.left = 0;
      this.pos.parent.top = 0;
      this.pos.parent.width = rect.width;
      this.pos.parent.height = rect.height;
    }
  }

  private fitToLimits(min: number, value: number, max: number) {
    if (value > min) {
      if (value < max) return value;
      else return max;
    } else return min;
  }

  private saveUserSelect() {
    if (this.userSelect === undefined && this.elementRef.nativeElement) {
      this.userSelect = (<HTMLElement>(
        this.elementRef.nativeElement
      )).style.userSelect;
      (<HTMLElement>this.elementRef.nativeElement).style.userSelect = "none";
    }
  }

  private restoreUserSelect() {
    if (this.userSelect !== undefined && this.elementRef.nativeElement) {
      (<HTMLElement>this.elementRef.nativeElement).style.userSelect =
        this.userSelect;
      this.userSelect = undefined;
    }
  }

  private toggleDrag(enable?: boolean) {
    if (enable !== undefined) {
      this.dragging = enable;
      if (!enable) this.restoreUserSelect();
    } else this.toggleDrag(!this.dragging);
  }

  private validateDragLimit(stringValue: string) {
    return new RegExp("none|parent|viewport").test(stringValue);
  }

  private savePosition() {
    if (
      this.positionProperties === undefined &&
      this.elementRef.nativeElement
    ) {
      let el = <HTMLElement>this.elementRef.nativeElement;
      this.positionProperties = {
        left: {
          value: el.style.getPropertyValue("left"),
          priority: el.style.getPropertyPriority("left"),
        },
        top: {
          value: el.style.getPropertyValue("top"),
          priority: el.style.getPropertyPriority("top"),
        },
        right: {
          value: el.style.getPropertyValue("right"),
          priority: el.style.getPropertyPriority("right"),
        },
        bottom: {
          value: el.style.getPropertyValue("bottom"),
          priority: el.style.getPropertyPriority("bottom"),
        },
      };
      el.style.setProperty("right", "initial", "important");
      el.style.setProperty("bottom", "initial", "important");
    }
  }

  private parseRedrawableChildren(children: QueryList<DraggableDirective>) {
    let redrawableChildren: DraggableDirective[] = [];
    children.toArray().forEach((child) => {
      if (this.elementRef.nativeElement !== child.elementRef.nativeElement) {
        if (child.dragLimit === "viewport" || child.position === "fixed")
          redrawableChildren.push(child);
      }
    });
    this.redrawableChildren = redrawableChildren;
  }

  private parseDragAreas(
    directiveChildren: QueryList<DraggableDirective>,
    areaChildren: QueryList<ElementRef>,
  ) {
    let dragAreas: ElementRef[] = [];
    let el = <HTMLElement>this.elementRef.nativeElement;
    if (el) {
      let directiveArray = directiveChildren.toArray();
      areaChildren.toArray().forEach((child) => {
        let childEl = <HTMLElement>child.nativeElement;
        if (childEl !== null && childEl !== el) {
          let parentEl = childEl;
          do {
            parentEl = parentEl.parentElement;
            if (
              directiveArray.filter(
                (item) => item.elementRef.nativeElement === parentEl,
              ).length
            ) {
              if (parentEl === el) dragAreas.push(child);
              else break;
            }
          } while (parentEl);
        }
      });
    }
    this.dragAreas = dragAreas;
  }

  private redrawChildren() {
    for (let i = 0; i < this.redrawableChildren.length; i++)
      this.redrawableChildren[i].recalculate();
  }

  private recalculate() {
    if (!this.dragging && this.elementRef.nativeElement) {
      this.updatePosData(true);
      this.savePosition();

      let el = <HTMLElement>this.elementRef.nativeElement;
      el.style.setProperty(
        "left",
        this.calculateX(this.pos.self.left) + "px",
        "important",
      );
      el.style.setProperty(
        "top",
        this.calculateY(this.pos.self.top) + "px",
        "important",
      );
    }
  }

  private canBeDragged(target: EventTarget) {
    if (target === this.elementRef.nativeElement) return this.isDragArea;
    else {
      for (let i = 0; i < this.dragAreas.length; i++) {
        if (target === this.dragAreas[i].nativeElement) return true;
      }
      return false;
    }
  }

  resetPosition() {
    if (
      this.positionProperties !== undefined &&
      this.elementRef.nativeElement
    ) {
      let el = <HTMLElement>this.elementRef.nativeElement;

      if (this.positionProperties.left.value)
        el.style.setProperty(
          "left",
          this.positionProperties.left.value,
          this.positionProperties.left.priority,
        );
      else el.style.removeProperty("left");

      if (this.positionProperties.top.value)
        el.style.setProperty(
          "top",
          this.positionProperties.top.value,
          this.positionProperties.top.priority,
        );
      else el.style.removeProperty("top");

      if (this.positionProperties.right.value)
        el.style.setProperty(
          "right",
          this.positionProperties.right.value,
          this.positionProperties.right.priority,
        );
      else el.style.removeProperty("right");

      if (this.positionProperties.bottom.value)
        el.style.setProperty(
          "bottom",
          this.positionProperties.bottom.value,
          this.positionProperties.bottom.priority,
        );
      else el.style.removeProperty("bottom");

      this.positionProperties = undefined;
    }
  }

  ngAfterContentInit() {
    this.parseRedrawableChildren(this.childrenDirectives);
    this.parseDragAreas(this.childrenDirectives, this.childrenDragAreas);
    this.childrenDirectives.changes
      .pipe(takeWhile(() => this.keepSubscriptionAlive))
      .subscribe((children: QueryList<DraggableDirective>) => {
        this.parseRedrawableChildren(children);
      });
    this.childrenDragAreas.changes
      .pipe(takeWhile(() => this.keepSubscriptionAlive))
      .subscribe((children: QueryList<ElementRef>) => {
        this.parseDragAreas(this.childrenDirectives, children);
      });
  }

  ngOnInit() {
    if (this.elementRef.nativeElement) {
      this.position = window
        .getComputedStyle(this.elementRef.nativeElement, null)
        .getPropertyValue("position");
      if (this.position === "static") {
        throw Error(
          'Only "relative", "absolute" and "fixed" positions are supported',
        );
      }
    } else throw Error("Unable to access DOM on init (draggable)");
  }

  ngOnDestroy() {
    this.keepSubscriptionAlive = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["userOptions"]) {
      let value = <userOptionsType>changes["userOptions"].currentValue;
      if (
        value.dragLimit !== undefined &&
        this.validateDragLimit(value.dragLimit)
      )
        this.dragLimit = value.dragLimit;
      if (value.enable !== undefined) this.enabled = value.enable;
      if (value.dragArea !== undefined) this.isDragArea = value.dragArea;
    }
  }
}
