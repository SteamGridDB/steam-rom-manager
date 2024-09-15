import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { APP } from "../../variables";

@Component({
  selector: "parsers-list",
  templateUrl: "../templates/parsers-list.component.html",
  styleUrls: ["../styles/parsers-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParsersListComponent {
  get lang() {
    return APP.lang.parsersList.component;
  }
}
