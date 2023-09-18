import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLinkActive } from '@angular/router';
import { FormBuilder, FormArray, FormGroup, FormControl } from '@angular/forms';
import { PreviewService, LoggerService, ParsersService } from '../services';
import { Subscription } from "rxjs";
import { APP } from '../../variables';
import {
  VDF_Manager,
  VDF_Error,
  CategoryManager,
  ControllerManager,
  Acceptable_Error
} from "../../lib";
import { UserData } from "../../models";

@Component({
  selector: 'view',
  templateUrl: '../templates/view.component.html',
  styleUrls: ['../styles/view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ViewComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();
  private vdfData: UserData;
  private controllerData: UserData;
  private categoryData: UserData;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private loggerService: LoggerService,
    private parsersService: ParsersService
  ) {

  }
  private get lang() {
    // return APP.lang.view.component;
    return {};
  }

  async refreshGames() {
    let knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    const vdfManager = new VDF_Manager();
    await vdfManager.prepare(knownSteamDirectories);
    await vdfManager.read();
    const vdfData = vdfManager.vdfData;
    const categoryManager = new CategoryManager();
    let categoryData: {[steamDirectory:string]: {[userId:string]: any}} = {};
    const controllerManager = new ControllerManager();
    let controllerData: {[steamDirectory: string]: {[userId: string]: any}} = {};
    for(const steamDirectory in vdfData) {
      categoryData[steamDirectory] = {};
      controllerData[steamDirectory] = {};
      for(const userId in vdfData[steamDirectory]) {
        categoryData[steamDirectory][userId] = await categoryManager.readCategories(steamDirectory, userId);
        const configsetDir = ControllerManager.configsetDir(steamDirectory, userId);
        controllerData[steamDirectory][userId] = controllerManager.readControllers(configsetDir);
      }
    }
    this.vdfData = vdfData;
    this.controllerData = controllerData;
    this.categoryData = categoryData;
    console.log(this.vdfData,this.controllerData,this.categoryData);
  }


  ngOnInit() {
    this.refreshGames();
  }

  ngOnDestroy () {
    this.subscriptions.unsubscribe()
  }
}
