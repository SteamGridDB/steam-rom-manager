import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { PreviewService, LoggerService } from '../services';
import { Subscription } from "rxjs";
import { APP } from '../../variables';

@Component({
  selector: 'view',
  templateUrl: '../templates/view.component.html',
  styleUrls: ['../styles/view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loggerService: LoggerService,
  ) {


  }
  private get lang() {
    // return APP.lang.view.component;
    return {};
  }

  refreshGames() {

  }


  ngOnInit() {

  }

  ngOnDestroy () {
    this.subscriptions.unsubscribe()
  }
}
