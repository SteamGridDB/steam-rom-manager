import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[refresh-images]",
  template: `
    <svg:g>
      <svg:g>
        <svg:path
          d="M484.08,296.216c-5.1-5.128-11.848-7.936-19.032-7.936H330.516c-14.828,0-26.86,12.036-26.86,26.868v22.796
                    c0,7.168,2.784,14.064,7.884,19.16c5.092,5.088,11.82,8.052,18.976,8.052H366.1c-31.544,30.752-74.928,50.08-120.388,50.08
                    c-71.832,0-136.028-45.596-159.744-113.344c-5.392-15.404-19.972-25.784-36.28-25.784c-4.316,0-8.592,0.708-12.7,2.144
                    c-9.692,3.396-17.48,10.352-21.932,19.596c-4.456,9.248-5.04,19.684-1.648,29.368c34.496,98.54,127.692,164.74,232.144,164.74
                    c64.132,0,123.448-23.948,169.572-67.656v25.22c0,14.836,12.384,27.108,27.224,27.108h22.792c14.84,0,26.86-12.272,26.86-27.108
                    V315.24C492,308.056,489.2,301.304,484.08,296.216z"
        />
      </svg:g>
    </svg:g>
    <svg:g>
      <svg:g>
        <svg:path
          d="M478.628,164.78C444.132,66.244,350.916,0.044,246.464,0.044c-64.136,0-123.464,23.952-169.588,67.66v-25.22
                    c0-14.832-12.344-27.112-27.184-27.112H26.896C12.06,15.372,0,27.652,0,42.484V176.76c0,7.18,2.824,13.868,7.944,18.964
                    c5.096,5.128,11.86,7.932,19.044,7.932l-0.08,0.06h134.604c14.84,0,26.832-12.028,26.832-26.86v-22.8
                    c0-14.836-11.992-27.216-26.832-27.216h-35.576c31.544-30.752,74.932-50.076,120.392-50.076
                    c71.832,0,136.024,45.596,159.74,113.348c5.392,15.404,19.968,25.78,36.28,25.78c4.32,0,8.588-0.704,12.7-2.144
                    c9.696-3.396,17.48-10.348,21.932-19.596C481.432,184.9,482.02,174.472,478.628,164.78z"
        />
      </svg:g>
    </svg:g>
    <svg:rect x="0" y="0" width="100%" height="100%" fill="transparent">
      <svg:title>{{ title }}</svg:title>
    </svg:rect>
  `,
  host: {
    viewBox: "0 0 492 492",
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
export class RefreshImagesComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
