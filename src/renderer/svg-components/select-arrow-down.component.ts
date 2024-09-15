import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[select-arrow-down]",
  template: ` <svg:polyline points="50,110 150,210 250,110" /> `,
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
        background-color: var(--select-arrow-down-background, transparent);
      }
      polyline {
        stroke-width: var(--select-arrow-down-width, 15);
        stroke: var(--color-select-arrow-down);
        fill: none;
      }
      :host(.hover):hover {
        background-color: var(
          --select-arrow-down-background-hover,
          transparent
        );
      }
      :host(.active):active {
        background-color: var(
          --select-arrow-down-background-active,
          transparent
        );
      }
      :host(.hover):hover polyline {
        stroke: var(--color-select-arrow-down-hover);
      }
      :host(.active):active polyline {
        stroke: var(--color-select-arrow-down-active);
      }
    `,
  ],
})
export class SelectArrowDownComponent {
  @Input() hover: boolean;
  @Input() active: boolean;
}
