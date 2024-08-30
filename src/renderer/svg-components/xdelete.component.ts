import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[xdelete]",
  template: `
    <svg
      fill="#000000"
      viewBox="-1.7 0 20.4 20.4"
      xmlns="http://www.w3.org/2000/svg"
      class="cf-icon-svg"
    >
      <path
        d="M16.417 10.283A7.917 7.917 0 1 1 8.5 2.366a7.916 7.916 0 0 1 7.917 7.917zm-6.804.01 3.032-3.033a.792.792 0 0 0-1.12-1.12L8.494 9.173 5.46 6.14a.792.792 0 0 0-1.12 1.12l3.034 3.033-3.033 3.033a.792.792 0 0 0 1.12 1.119l3.032-3.033 3.033 3.033a.792.792 0 0 0 1.12-1.12z"
      />
    </svg>
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
        fill: white;
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
        fill: red;
      }
      :host(.active):active path {
        fill: var(--color-refresh-images-active);
      }
    `,
  ],
})
export class XDeleteComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
