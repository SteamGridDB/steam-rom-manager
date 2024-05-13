import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { LoggerService } from '../services';
import { AlertMessage } from '../../models';
import { Subscription } from "rxjs";

@Component({
  selector: 'alert',
  template: `
  <div *ngIf="currentMessage" [@slideIn]="" [ngClass]="currentMessage.type" (click)="closeAlert()">
  {{currentMessage.text}}
  </div>
  `,
  styleUrls: [
    '../styles/alert.component.scss'
  ],
  animations: [
    trigger('fadeInOut', [
      transition('void => *', [
        style({ opacity: '0' }),
        animate(500, style({ opacity: '1' }))
      ]),
      transition('* => void', [
        animate(500, style({ opacity: '0' }))
      ])
    ]),
    trigger('slideIn', [
      transition('void => *', [
        style({ right: '-50vw' }),
        animate(500, style({ right: '0' }))
      ]),
      transition('* => void', [
        animate(500, style({ right: '0' })),
        style({ right: '-50vw' })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent implements OnInit, OnDestroy {
  currentMessage: AlertMessage = undefined;
  private subscriptions: Subscription = new Subscription();
  private timeoutId: number = undefined;

  constructor(private router: Router, private loggerService: LoggerService, private changeRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.subscriptions.add(this.loggerService.getAlertMessage().subscribe((message) => {
      if (message != undefined && this.router.url !== '/logger') {
        this.clearTimeout();
        this.currentMessage = message;
        if (message.timeout > 0) {
          this.timeoutId = window.setTimeout(() => {
            this.currentMessage = undefined;
            this.changeRef.detectChanges();
          }, message.timeout > 1000 ? message.timeout - 1000 : message.timeout)
        }
        this.changeRef.detectChanges();
      }
      else {
        this.currentMessage = undefined;
        this.changeRef.detectChanges();
      }
    }));
  }

  ngOnDestroy() {
    this.clearTimeout();
    this.subscriptions.unsubscribe();
  }

  closeAlert() {
    this.clearTimeout();
    this.currentMessage = undefined;
  }

  private clearTimeout() {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
