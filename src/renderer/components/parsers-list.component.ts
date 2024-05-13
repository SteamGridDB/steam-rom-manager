import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from "@angular/core";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import { ParsersService, LanguageService, UserExceptionsService } from "../services";
import { UserConfiguration } from "../../models";
import { Subscription } from "rxjs";
import { APP } from "../../variables";

@Component({
  selector: "parsers-list",
  templateUrl: "../templates/parsers-list.component.html",
  styleUrls: ["../styles/parsers-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParsersListComponent {
  get lang(){
     return APP.lang.parsersList.component;
 }
}
