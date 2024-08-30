import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[image-alert]",
  template: `
    <svg:g>
      <svg:g>
        <svg:path
          d="M496.899,381.746L353.57,153.019l-46.084-76.807c-11.976-22.131-32.414-34.108-52.852-34.108
                    c-20.439,0-39.315,13.669-52.853,34.107L12.367,381.746c-18.746,29.03-11.977,49.469-6.769,59.753
                    c10.284,17.053,29.03,25.646,56.368,25.646h389.109c27.338,0,46.084-8.591,52.853-25.646
                    C508.746,431.215,515.645,410.776,496.899,381.746z M476.331,424.444c-1.692,5.077-11.977,8.591-25.646,8.591H61.575
                    c-11.977,0-22.131-3.385-25.646-8.591c-3.515-5.208-1.692-13.669,5.077-23.953L230.419,94.957
                    c6.769-10.285,15.361-17.053,23.953-17.053c8.592,0,18.746,6.769,25.646,18.747l34.107,54.676l156.998,249.165
                    C476.331,410.776,479.716,419.367,476.331,424.444z"
        />
      </svg:g>
    </svg:g>
    <svg:g>
      <svg:g>
        <svg:path
          d="M268.172,381.746c-6.899-6.77-17.053-6.77-23.953,0c-3.385,3.385-5.077,8.591-5.077,11.977
                    c0,3.386,1.692,8.591,5.077,11.977c3.385,3.385,6.769,5.077,11.977,5.077s8.592-1.692,11.977-5.077
                    c3.385-3.385,5.077-6.769,5.077-11.977C273.249,388.645,271.557,385.132,268.172,381.746z"
        />
      </svg:g>
    </svg:g>
    <svg:g>
      <svg:g>
        <svg:path
          d="M256.195,139.349c-8.592,0-17.054,8.591-17.054,17.053v13.669v182.643c0,10.285,6.769,17.053,17.054,17.053
                    c8.592,0,17.054-6.769,17.054-17.053V170.071v-13.669C273.249,146.249,264.787,139.349,256.195,139.349z"
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
export class ImageAlertComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
