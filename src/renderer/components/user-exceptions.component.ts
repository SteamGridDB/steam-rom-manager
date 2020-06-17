import { Component, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { UserExceptions } from '../../models';
import { UserExceptionsService } from '../services';;
import { Subscription, Observable } from "rxjs";
import { APP } from '../../variables';
@Component({
  selector: 'user-exceptions',
  templateUrl: '../templates/user-exceptions.component.html',
  styleUrls: ['../styles/user-exceptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExceptionsComponent implements AfterViewInit, OnDestroy {
  private userExceptions: UserExceptions = {};
  private currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
  private subscriptions: Subscription = new Subscription();

  private exceptionsForm: FormGroup;
  private exceptionsFormItems: FormArray;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private exceptionsService: UserExceptionsService,
    private formBuilder: FormBuilder
  ) {
    this.currentDoc.content = this.lang.docs__md.userExceptions.join('');
  }
  private get lang() {
    return APP.lang.userExceptions.component;
  }

  save() {
    let error = this.exceptionsService.set(this.userExceptions||{});
    if(!error) {
      this.exceptionsService.saveUserExceptions();
    }
  }

  createItem(): FormGroup {
    return this.formBuilder.group({
      oldTitle:'',
      newTitle:'',
      commandLineArguments: '',
      exclude: false
    })
  }

  addItem() {
    this.exceptionsFormItems = this.exceptionsForm.get('items') as FormArray;
    this.exceptionsFormItems.push(this.createItem());
  }
  deleteItem(index: number) {
    this.exceptionsFormItems.removeAt(this.exceptionsFormItems.value.findIndex((exception: any) => exception.id === index))
  }

  ngOnInit() {
    this.exceptionsForm = this.formBuilder.group({
      oldTitle: '',
      newTitle: '',
      commandLineArguments: '',
      exclude: false,
      items: this.formBuilder.array([this.createItem()])
    })
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
