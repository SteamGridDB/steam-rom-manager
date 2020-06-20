import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ParsersService, LanguageService, UserExceptionsService } from '../services';
import { UserConfiguration } from '../../models';
import { Subscription } from 'rxjs';
import { APP } from '../../variables';

@Component({
  selector: 'nav',
  templateUrl: '../templates/nav.component.html',
  styleUrls: [
    '../styles/nav.component.scss'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent {
  private userConfigurations: { saved: UserConfiguration, current: UserConfiguration }[];
  private isExceptionsUnsaved: boolean = false;
  private dummy: boolean = true;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private changeRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((userConfigurations) => {
      this.userConfigurations = userConfigurations;
      this.refreshActiveRoute();
      this.changeRef.detectChanges();
    }));
    this.subscriptions.add(this.exceptionsService.isUnsavedObservable.subscribe((val:boolean)=>{
      this.isExceptionsUnsaved = val;
      this.refreshActiveRoute();
      this.changeRef.detectChanges();
    }))
    this.languageService.observeChanges().subscribe((lang) => {
      this.changeRef.detectChanges();
    });
  }

  private refreshActiveRoute(){
    this.dummy = !this.dummy;
  }

  private get lang(){
    return APP.lang.nav.component;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
