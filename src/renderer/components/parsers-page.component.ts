import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { APP } from "../../variables";
import { ParsersService } from "../services";

// A parser's editor: /parsers/<parserId>, or /parsers/new (the parser list is
// in the sidebar).
// Each parser gets a fresh editor, so nothing from one parser's form can
// carry over to another's.
@Component({
  selector: "parsers-page",
  templateUrl: "../templates/parsers-page.component.html",
  styleUrls: ["../styles/parsers-page.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParsersPageComponent implements OnDestroy {
  // The open parser's id, "new", or null (none open).
  parserId: string | null = null;
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parsersService: ParsersService,
    private changeRef: ChangeDetectorRef,
  ) {}

  get lang() {
    return APP.lang.parsers.component;
  }

  get intro() {
    return this.lang.docs__md.intro.join("");
  }

  ngOnInit() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        this.parserId = params.get("parserId");
        this.changeRef.markForCheck();
      }),
    );
    // A parser that's gone (deleted, or a stale link): close it.
    this.subscriptions.add(
      this.parsersService.getUserConfigurations().subscribe(() => {
        if (
          this.parserId &&
          this.parserId !== "new" &&
          this.parsersService.indexOfParser(this.parserId) === -1 &&
          this.parsersService.getUserConfigurationsArray().length
        ) {
          this.router.navigate(["/parsers"]);
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
