import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { UserExceptions } from '../../models';
import { UserExceptionsService, LoggerService } from '../services';
import { Subscription } from "rxjs";
import { APP } from '../../variables';
import * as _ from 'lodash';

@Component({
  selector: 'user-exceptions',
  templateUrl: '../templates/user-exceptions.component.html',
  styleUrls: ['../styles/user-exceptions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExceptionsComponent implements OnDestroy {
  private currentDoc: { activePath: string, content: string } = { activePath: '', content: '' };
  private subscriptions: Subscription = new Subscription();
  private userExceptions: UserExceptions;

  private exceptionsForm: FormGroup;
  private exceptionsFormItems: FormArray;

  private filterValue = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private exceptionsService: UserExceptionsService,
    private loggerService: LoggerService,
    private formBuilder: FormBuilder
  ) {
    this.currentDoc.content = this.lang.docs__md.userExceptions.join('');
  }
  private get lang() {
    return APP.lang.userExceptions.component;
  }
  exceptionsInfoClick() {
    this.currentDoc.content = this.lang.docs__md.userExceptions.join('');
  }

  save() {
    this.exceptionsService.saveUserExceptions();
  }

  deleteAll() {
    this.exceptionsFormItems = this.exceptionsForm.get('items') as FormArray;
    while(this.exceptionsFormItems.length>0) {
      this.exceptionsFormItems.removeAt(0);
    }
  }

  createItem(): FormGroup {
    return this.formBuilder.group({
      oldTitle:'',
      newTitle:'',
      searchTitle:'',
      commandLineArguments: '',
      exclude: false,
      excludeArtwork: false
    })
  }

  setForm() {
    this.exceptionsForm = this.formBuilder.group({
      items: this.formBuilder.array(Object.entries(this.userExceptions.titles)
        .map(e=>this.formBuilder.group(Object.assign({oldTitle: e[0]},e[1]))))
    });
    this.exceptionsForm.valueChanges.subscribe((val: any)=>{
      this.exceptionsService.setIsUnsaved(true);
      let error = this.exceptionsService.setCurrent({
        exceptionsVersion: this.userExceptions.exceptionsVersion,
        titles: Object.fromEntries(val.items
        .filter((item: any)=>item.oldTitle)
        .map((item: any)=>[item.oldTitle,_.omit(item,'oldTitle')]))||{}
      });
    });
  }

  undo() {
    this.exceptionsService.setIsUnsaved(false);
    this.exceptionsService.setCurrent(null);
  }

  addItem() {
    this.exceptionsFormItems = this.exceptionsForm.get('items') as FormArray;
    this.exceptionsFormItems.push(this.createItem());
  }
  deleteItem(index: number) {
    this.exceptionsFormItems = this.exceptionsForm.get('items') as FormArray;
    this.exceptionsFormItems.removeAt(index);
  }

  ngOnInit() {
    this.exceptionsService.setIsUnsaved(false);
    this.subscriptions.add(this.exceptionsService.dataObservable.subscribe((data)=>{
      this.userExceptions = data.current ? data.current : data.saved;
      if(!this.exceptionsService.isUnsaved) {
        this.setForm();
      }
      if(data.current) {
        this.exceptionsService.setIsUnsaved(true);
      } else {
        this.exceptionsService.setIsUnsaved(false);
      }
    }));
  }

  ngOnDestroy () {
    this.subscriptions.unsubscribe()
  }
}
