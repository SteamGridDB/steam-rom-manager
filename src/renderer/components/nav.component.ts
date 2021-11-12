import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ApplicationRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
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
export class NavComponent implements OnDestroy {
  private userConfigurations: { saved: UserConfiguration, current: UserConfiguration }[];
  private numConfigurations: number = -1;
  private isExceptionsUnsaved: boolean = false;
  private dummy: boolean = true;
  private subscriptions: Subscription = new Subscription();

  private navForm: FormGroup;
  private navFormItems: FormArray;

  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private changeRef: ChangeDetectorRef,
    private appRef: ApplicationRef,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit() {
    this.subscriptions.add(this.parsersService.getUserConfigurations().subscribe((userConfigurations) => {
      //if(userConfigurations.length != this.numConfigurations) {
        this.navForm = this.formBuilder.group({
          parserStatuses: this.formBuilder.array(userConfigurations.map((config: {saved: UserConfiguration, current: UserConfiguration}) => {
            let singleton={};
            singleton[config.saved.parserId] = ! config.saved.disabled;
            return this.formBuilder.group(singleton);
          }))
        });
        (this.navForm.get("parserStatuses") as FormArray).controls.forEach((control: FormControl)=>{
          control.valueChanges.subscribe((val: {[parserId: string]: boolean}) => {
            console.log("Little Change: ", val)
            this.parsersService.changeEnabledStatus(Object.keys(val)[0], Object.values(val)[0])
          })
        })
        this.numConfigurations = userConfigurations.length;
        this.userConfigurations = userConfigurations;
      //}

      this.appRef.tick()
      this.changeRef.detectChanges();
      this.refreshActiveRoute();
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

  getParserControls() {
    return (this.navForm.get('parserStatuses') as FormArray).controls;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
