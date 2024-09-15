import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { FormBuilder, FormArray, FormGroup, FormControl } from "@angular/forms";
import {
  ParsersService,
  LanguageService,
  UserExceptionsService,
} from "../services";
import { UserConfiguration } from "../../models";
import { Subscription } from "rxjs";
import { APP } from "../../variables";

@Component({
  selector: "navarea",
  templateUrl: "../templates/navarea.component.html",
  styleUrls: ["../styles/navarea.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavareaComponent implements OnDestroy {
  constructor() {}

  ngOnInit() {}

  ngOnDestroy() {}
}
