import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[image-lens]",
  template: `
    <svg:path
      d="M168.5.7c-36 4.2-59.9 12.7-87 30.8-42 28-70.9 72.8-79 122.5-16.6 101.2 53.2 196.4 155 211.5 13.6 2 39.7 2 52.9 0 30.7-4.7 58.5-16.3 83.6-34.9l7.5-5.6 6.7 6.7 6.7 6.7-3.9 4.2c-6.4 6.9-7.5 9.8-7.5 19.4 0 6.8.5 9.3 2.2 12.5 1.2 2.3 29.9 31.6 67.5 69.1 61.8 61.7 65.6 65.3 70.7 66.9 6.7 2.2 15 1.6 21.2-1.5 5.9-3 40.9-38 43.9-43.9 3.1-6.1 3.6-13.4 1.6-20.7-1.7-5.9-1.8-6-66.9-71.2-37.4-37.5-66.9-66.3-69.2-67.5-3.2-1.7-5.7-2.2-12.5-2.2-9.6 0-12.5 1.1-19.4 7.5l-4.2 3.9-6.7-6.7-6.7-6.7 5.6-7.5c18.5-24.9 30.2-53 34.9-83.8 2-13.1 2-39 0-52.6-3.1-20.5-8.3-37.2-17.2-55.1C319.9 45.6 265.9 7.9 202.8 1.1c-9.1-1-27.5-1.2-34.3-.4zm40.5 35c11.7 1.8 29.9 7.7 41.1 13.3 42.8 21.4 72.2 60.2 81.5 107.5 2.6 12.8 2.6 40.4 0 54-11.5 61.7-59.4 109.6-121.1 121.1-14.7 2.8-42.2 2.5-56.2-.4-29.6-6.4-55.4-20.3-76.2-41.1-12-12-19.8-22.5-27.2-36.4-9.5-18.1-15.2-37.7-16.8-57.9-2.7-34.2 5.9-67.1 25-95.9 8.4-12.6 28.2-32.4 40.8-40.8 32.7-21.7 69.8-29.6 109.1-23.4zM370.5 347l8 8-11.8 11.8-11.7 11.7-8.2-8.3-8.3-8.2 11.5-11.5c6.3-6.3 11.7-11.5 12-11.5.3 0 4.1 3.6 8.5 8zm68.8 68.8 36.7 36.7-11.8 11.8-11.7 11.7-37-37-37-37 11.5-11.5c6.3-6.3 11.7-11.5 12-11.5.3 0 17 16.5 37.3 36.8z"
      fill="#ffffff"
    />

    <svg:path
      d="M175.5 69.3c-4.5 2.5-8.5 9.2-8.5 14.2.1 4.5 3.3 10.9 7 13.5 2.4 1.7 5.4 2.5 12.3 3.2 18.6 1.7 30.6 5.6 42.9 13.7 13.2 8.8 22.9 19.9 29.7 34.1 5 10.5 6.9 17.7 8 30.6 1 11.6 2.6 15.3 7.8 18.9 6.6 4.4 17.5 2.8 22.3-3.3 3.6-4.4 4.3-9.6 3.1-21.2-5.6-53.6-45.3-96-97.6-104.5-13.4-2.2-22.1-2-27 .8z"
      fill="#ffffff"
    />
  `,
  host: {
    viewBox: "0 0 512 512",
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
export class ImageLensComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
