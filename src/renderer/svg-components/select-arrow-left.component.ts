import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[select-arrow-left]",
  template: ` <svg:polyline points="220,50 100,150 220,250" /> `,
  host: {
    viewBox: "0 0 300 300",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg",
    "[class.hover]": "hover",
    "[class.active]": "active",
  },
  styles: [
    `
      :host {
        height: 1em;
        vertical-align: middle;
        background-color: var(--select-arrow-left-background, transparent);
      }
      polyline {
        stroke-width: var(--select-arrow-left-width, 15);
        stroke: var(--color-select-arrow-left);
        fill: none;
      }
      :host(.hover):hover {
        background-color: var(
          --select-arrow-left-background-hover,
          transparent
        );
      }
      :host(.active):active {
        background-color: var(
          --select-arrow-left-background-active,
          transparent
        );
      }
      :host(.hover):hover polyline {
        stroke: var(--color-select-arrow-left-hover);
      }
      :host(.active):active polyline {
        stroke: var(--color-select-arrow-left-active);
      }
    `,
  ],
})
export class SelectArrowLeftComponent {
  @Input() hover: boolean;
  @Input() active: boolean;
}
