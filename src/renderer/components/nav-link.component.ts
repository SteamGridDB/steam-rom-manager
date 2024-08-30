import { Component, ViewEncapsulation } from "@angular/core";

@Component({
  selector: "nav-link",
  template: `
    <span class="content" text-scroll>
      <ng-content></ng-content>
    </span>
  `,
  styleUrls: ["../styles/nav-link.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class NavLinkComponent {}
