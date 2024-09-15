import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[add-images]",
  template: `
    <svg:g>
      <svg:g>
        <svg:path
          d="M311.3,108.74c-15.304,0-27.752,12.444-27.752,27.752c0.004,15.3,12.452,27.744,27.752,27.744s27.752-12.44,27.752-27.744
                    C339.052,121.188,326.604,108.74,311.3,108.74z"
        />
      </svg:g>
    </svg:g>
    <svg:g>
      <svg:g>
        <svg:path
          d="M252.164,286.1c-49.992,0-90.508,40.52-90.508,90.5c0,49.984,40.516,90.508,90.508,90.508s90.512-40.524,90.512-90.508
                    C342.676,326.62,302.156,286.1,252.164,286.1z M303.148,387.328h-39.336v40.344c0,6.476-5.336,11.744-11.812,11.744
                    s-11.812-5.264-11.812-11.744v-40.344h-39.172c-6.476,0-11.748-5.336-11.748-11.812s5.268-11.812,11.748-11.812h39.172v-38.168
                    c0-6.472,5.336-11.744,11.812-11.744s11.812,5.268,11.812,11.744v38.168h39.336c6.476,0,11.748,5.336,11.748,11.812
                    S309.624,387.328,303.148,387.328z"
        />
      </svg:g>
    </svg:g>
    <svg:g>
      <svg:g>
        <svg:path
          d="M484.356,36.892H19.976C9.12,36.892,0,46.56,0,57.416v299.496c0,10.86,9.12,18.6,19.976,18.6h118.056
                    c0-63,51.2-114.124,114.132-114.124c62.936,0,114.136,51.124,114.136,114.124h118.056c10.856,0,19.644-7.744,19.644-18.6V57.416
                    C504,46.56,495.212,36.892,484.356,36.892z M391.5,172.552l-74.456,74.472L203.712,133.708c-1.54-1.54-4.024-1.54-5.564,0
                    l-71.884,71.88l-32.816-32.812c-1.536-1.54-4.172-1.54-5.708,0l-52.304,52.16V72.328H468.56v171.748l-71.5-71.524
                    C395.52,171.012,393.04,171.012,391.5,172.552z"
        />
      </svg:g>
    </svg:g>
    <svg:rect x="0" y="0" width="100%" height="100%" fill="transparent">
      <svg:title>{{ title }}</svg:title>
    </svg:rect>
  `,
  host: {
    viewBox: "0 0 509.25 509.25",
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
        background-color: var(--select-image-alert-background, transparent);
      }
      path {
        fill: var(--color-image-alert);
      }
      :host(.hover):hover {
        background-color: var(
          --select-image-alert-background-hover,
          transparent
        );
      }
      :host(.active):active {
        background-color: var(
          --select-image-alert-background-active,
          transparent
        );
      }
      :host(.hover):hover path {
        fill: var(--color-image-alert-hover);
      }
      :host(.active):active path {
        fill: var(--color-image-alert-active);
      }
    `,
  ],
})
export class AddImagesComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
