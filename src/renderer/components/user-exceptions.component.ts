import { Component, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { UserExceptions } from '../../models';
import { UserExceptionsService } from '../services';;
import { Subscription, Observable } from "rxjs";
@Component({
  selector: 'user-exceptions',
  templateUrl: '../templates/user-exceptions.component.html',
  styleUrls: ['../styles/user-exceptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExceptionsComponent implements AfterViewInit, OnDestroy {
  private userExceptions: UserExceptions = {};
  private subscriptions: Subscription = new Subscription();
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private exceptionsService: UserExceptionsService
  ) {

  }

  save() {
    let error = this.exceptionsService.set(this.userExceptions||{});
    if(!error) {
      this.exceptionsService.saveUserExceptions();
    }
  }

  ngAfterViewInit() {
    this.subscriptions.add(this.exceptionsService.dataObservable.subscribe((data)=>{
      this.userExceptions = data;
    }))
  }

ngOnDestroy () {
    this.subscriptions.unsubscribe()
  }
}
