import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'custom-variables',
  template: `../templates/custom-variables.component.html`,
  styleUrls: ['../styles/custom-variables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomVariablesComponent {
  constructor(private router: Router,
    private activatedRoute: ActivatedRoute,) { }
}
