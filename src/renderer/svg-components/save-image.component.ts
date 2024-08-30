import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[save-image]",
  template: `
    <svg:g>
      <svg:g>
        <svg:path
          d="M382.56,233.376C379.968,227.648,374.272,224,368,224h-64V16c0-8.832-7.168-16-16-16h-64c-8.832,0-16,7.168-16,16v208h-64
			c-6.272,0-11.968,3.68-14.56,9.376c-2.624,5.728-1.6,12.416,2.528,17.152l112,128c3.04,3.488,7.424,5.472,12.032,5.472
			c4.608,0,8.992-2.016,12.032-5.472l112-128C384.192,245.824,385.152,239.104,382.56,233.376z"
        />
      </svg:g>
    </svg:g>
    <svg:g>
      <svg:g>
        <svg:path
          d="M432,352v96H80v-96H16v128c0,17.696,14.336,32,32,32h416c17.696,0,32-14.304,32-32V352H432z"
        />
      </svg:g>
    </svg:g>

    <svg:rect x="0" y="0" width="100%" height="100%" fill="transparent">
      <svg:title>{{ title }}</svg:title>
    </svg:rect>
  `,
  host: {
    viewBox: "0 0 512 512",
    version: "1.1",
    xmlns: "http://www.w3.org/2000/svg",
    x: "0px",
    y: "0px",
    "[class.hover]": "hover",
    "[class.active]": "active",
  },
  styles: [
    `
      :host {
        height: 1em;
        vertical-align: middle;
        background-color: var(--select-refresh-images-background, transparent);
      }
      path {
        fill: var(--color-refresh-images);
      }
      :host(.hover):hover {
        background-color: var(
          --select-refresh-images-background-hover,
          transparent
        );
      }
      :host(.active):active {
        background-color: var(
          --select-refresh-images-background-active,
          transparent
        );
      }
      :host(.hover):hover path {
        fill: var(--color-refresh-images-hover);
      }
      :host(.active):active path {
        fill: var(--color-refresh-images-active);
      }
    `,
  ],
})
export class SaveImagesComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
