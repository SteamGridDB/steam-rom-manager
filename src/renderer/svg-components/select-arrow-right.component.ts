import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[select-arrow-right]",
  template: ` <svg:polyline points="80,50 200,150 80,250" /> `,
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
        background-color: var(--select-arrow-right-background, transparent);
      }
      polyline {
        stroke-width: var(--select-arrow-right-width, 15);
        stroke: var(--color-select-arrow-right);
        fill: none;
      }
      :host(.hover):hover {
        background-color: var(
          --select-arrow-right-background-hover,
          transparent
        );
      }
      :host(.active):active {
        background-color: var(
          --select-arrow-right-background-active,
          transparent
        );
      }
      :host(.hover):hover polyline {
        stroke: var(--color-select-arrow-right-hover);
      }
      :host(.active):active polyline {
        stroke: var(--color-select-arrow-right-active);
      }
    `,
  ],
})
export class SelectArrowRightComponent {
  @Input() hover: boolean;
  @Input() active: boolean;
}
