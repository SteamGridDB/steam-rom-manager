import { Component, Input } from "@angular/core";

@Component({
  selector: "svg[copy-icon]",
  template: `
    <svg:g>
      <svg:g>
        <svg:path
          d="M460.52,96.988c-0.06-0.304-0.176-0.588-0.268-0.88c-0.068-0.196-0.108-0.4-0.188-0.588
                    c-0.128-0.308-0.296-0.584-0.464-0.872c-0.084-0.16-0.16-0.328-0.26-0.48c-0.26-0.396-0.572-0.76-0.904-1.1
                    c-0.024-0.028-0.04-0.06-0.068-0.084l-0.004-0.004c0-0.004-0.004-0.004-0.004-0.008L367.828,2.236h-0.004
                    c-0.36-0.364-0.756-0.692-1.184-0.98c-0.128-0.084-0.272-0.14-0.408-0.216c-0.308-0.184-0.616-0.368-0.944-0.512
                    c-0.188-0.076-0.38-0.112-0.564-0.172c-0.3-0.1-0.596-0.176-0.912-0.24C363.304,0.016,362.78,0,362.252,0H127.944
                    c-11.964,0-21.632,9.652-21.632,21.612V63h-41.18c-11.968,0-21.82,9.468-21.82,21.428v398.08c0,11.96,9.852,21.492,21.82,21.492
                    h311.024c11.964,0,21.532-9.532,21.532-21.492V441h41.284c11.964,0,21.716-9.344,21.716-21.304V98.544
                    C460.688,98.016,460.624,97.5,460.52,96.988z M381.936,482.508c0,3.276-2.504,5.744-5.78,5.744H65.132
                    c-3.28,0-6.068-2.464-6.068-5.744V84.428c0-3.276,2.788-5.68,6.068-5.68h226.244v59.584c0,17.04,14.052,30.98,31.092,30.98h59.468
                    V482.508z M444.94,419.692c-0.004,3.276-2.688,5.556-5.968,5.556h-41.284V161.36c0-2.084-0.748-3.148-2.22-4.616l-90.48-89.808
                    C301.58,63.528,301.524,63,299.432,63H122.064V21.612c0-3.276,2.608-5.864,5.884-5.864h226.428v59.764
                    c0,17.044,13.868,30.796,30.908,30.796h59.656V419.692z"
        />
      </svg:g>
    </svg:g>
    <svg:rect x="0" y="0" width="100%" height="100%" fill="transparent">
      <svg:title>{{ title }}</svg:title>
    </svg:rect>
  `,
  host: {
    viewBox: "0 0 504 504",
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
export class CopyIconComponent {
  @Input() title: string;
  @Input() hover: boolean;
  @Input() active: boolean;
}
