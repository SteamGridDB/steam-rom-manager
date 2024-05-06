import { Injectable } from '@angular/core';
import { LoggerService, ParsersService } from '../services';
import { VDF_ListData, UserData, ControllerTemplates } from '../../models';
import * as _ from "lodash";
import {
  VDF_Manager,
  CategoryManager,
  ControllerManager,
} from "../../lib";
import { controllerTypes } from '../../lib/controller-manager';
import { BehaviorSubject } from 'rxjs';


@Injectable()
export class ViewService {
  vdfData: VDF_ListData;
  controllerData: UserData;
  categoryData: UserData;
  controllerTemplateData: ControllerTemplates;
  status: {[k: string]: BehaviorSubject<boolean>} = {
    refreshingShortcuts: new BehaviorSubject(false),
    refreshingDetails: new BehaviorSubject(false)
  }
  constructor(
    private parsersService: ParsersService) {
  }

  private clearData() {
    this.vdfData = null;
    this.categoryData = {};
    this.controllerData = {};
    this.controllerTemplateData = {};
  }
  
  async refreshGames(force?: boolean) {
    this.clearData();
    this.status.refreshingShortcuts.next(true);
    this.status.refreshingDetails.next(true);
    let knownSteamDirectories = this.parsersService.getKnownSteamDirectories();
    const vdfManager = new VDF_Manager();
    const categoryManager = new CategoryManager();
    const controllerManager = new ControllerManager();
    await vdfManager.prepare(knownSteamDirectories);
    await vdfManager.read({ addedItems: false });
    this.vdfData = vdfManager.vdfData;
    this.status.refreshingShortcuts.next(false);
    for(const steamDirectory in this.vdfData) {
      this.categoryData[steamDirectory] = {};
      this.controllerData[steamDirectory] = {};
      this.controllerTemplateData[steamDirectory] = {};
      for(const userId in this.vdfData[steamDirectory]) {
        try {
          this.categoryData[steamDirectory][userId] = await categoryManager.readCategories(steamDirectory, userId);
        } catch (e) {}
        const configsetDir = ControllerManager.configsetDir(steamDirectory, userId);
        const localConfigPath = ControllerManager.localConfigPath(steamDirectory, userId);
        this.controllerData[steamDirectory][userId] = {
          configsets: controllerManager.readControllers(configsetDir),
          localConfig: controllerManager.readLocalConfig(localConfigPath),
        }
      }
      for(const controllerType of controllerTypes) {
        this.controllerTemplateData[steamDirectory][controllerType] = await ControllerManager.readTemplates(steamDirectory, controllerType)
      }
    }
    this.status.refreshingDetails.next(false);
  }
}
