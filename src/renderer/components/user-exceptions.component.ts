import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Renderer2,
  ElementRef,
  RendererStyleFlags2,
} from "@angular/core";
import {
  AppSettings,
  GameException,
  GameExclusion,
  SelectItem,
  UserExceptions,
} from "../../models";
import {
  UserExceptionsService,
  LoggerService,
  SettingsService,
} from "../services";
import { CoreClientService } from "../services/core-client.service";
import { Subscription } from "rxjs";
import { APP } from "../../variables";
import {
  emptyExceptions,
  newRuleId,
  ruleTitle,
} from "../../core/exceptions-format";
import { COMPAT_NONE } from "../../lib/helpers/steam/compat-constants";
import type { CompatToolInfo } from "../../lib/helpers/steam/compat-constants";
import { FuzzyTestPipe } from "../pipes";

type Tab = "exceptions" | "exclusions";

// Exceptions page: edits a copy of the saved rules (draft); saving replaces
// them. Rules made on the Add Games page match a game by app id and can't be
// re-targeted; rules added here match by title, which stays editable.
@Component({
  selector: "user-exceptions",
  templateUrl: "../templates/user-exceptions.component.html",
  styleUrls: ["../styles/user-exceptions.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExceptionsComponent implements OnDestroy {
  currentDoc = { activePath: "", content: "" };
  appSettings: AppSettings;
  draft: UserExceptions = emptyExceptions();
  private saved = "";
  tab: Tab = "exceptions";
  filterValue = "";
  sortBy = "timeStamp|desc";
  showMarkdown = false;
  compatToolOptions: SelectItem[] = [];
  private subscriptions = new Subscription();

  sortByOpts: SelectItem[] = [
    { value: "timeStamp", displayValue: this.lang.sortBy.dateAdded },
    { value: "title", displayValue: this.lang.sortBy.extractedTitle },
  ].flatMap((x) => [
    {
      value: x.value + "|asc",
      displayValue: this.lang.sortBy.asc__i.interpolate({
        field: x.displayValue,
      }),
    },
    {
      value: x.value + "|desc",
      displayValue: this.lang.sortBy.desc__i.interpolate({
        field: x.displayValue,
      }),
    },
  ]);

  constructor(
    private exceptionsService: UserExceptionsService,
    private loggerService: LoggerService,
    private changeDetectorRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private settingsService: SettingsService,
    private coreClient: CoreClientService,
    private fuzzyTest: FuzzyTestPipe,
  ) {
    this.appSettings = this.settingsService.getSettings();
    this.currentDoc.content = this.lang.docs__md.userExceptions.join("");
  }

  get lang() {
    return APP.lang.userExceptions.component;
  }

  get isUnsaved() {
    return JSON.stringify(this.draft) !== this.saved;
  }

  ruleTitle = ruleTitle;

  // The shown rules of the current tab: rules added here since the last
  // save first (newest first, never filtered out), then the rest filtered
  // and sorted.
  visible(): (GameException | GameExclusion)[] {
    const [field, direction] = this.sortBy.split("|");
    const rules: (GameException | GameExclusion)[] =
      this.tab === "exceptions" ? this.draft.exceptions : this.draft.exclusions;
    const added = rules
      .filter((rule) => this.isNew(rule))
      .sort((a, b) => b.timeStamp - a.timeStamp);
    const rest = rules
      .filter((rule) => !this.isNew(rule))
      .filter((rule) =>
        this.fuzzyTest.transform(ruleTitle(rule), this.filterValue),
      )
      .sort((a, b) => {
        const result =
          field === "title"
            ? ruleTitle(a).localeCompare(ruleTitle(b))
            : a.timeStamp - b.timeStamp;
        return direction === "asc" ? result : -result;
      });
    return [...added, ...rest];
  }

  // Rules added on this page and not saved yet (they can be cancelled).
  private newIds = new Set<string>();
  isNew(rule: { id: string }) {
    return this.newIds.has(rule.id);
  }

  trackRule(_index: number, rule: { id: string }) {
    return rule.id;
  }

  asException(rule: GameException | GameExclusion) {
    return rule as GameException;
  }

  // Any edit: tell the navigation whether there's something to save.
  changed() {
    this.exceptionsService.setIsUnsaved(this.isUnsaved);
  }

  setTab(tab: Tab) {
    this.tab = tab;
    this.changeDetectorRef.detectChanges();
  }

  // A rule for a title, added by hand.
  addByTitle() {
    const base = { id: newRuleId(), matchTitle: "", timeStamp: Date.now() };
    if (this.tab === "exceptions") {
      this.draft.exceptions.unshift({
        ...base,
        newTitle: "",
        searchTitle: "",
        sgdbId: "",
        commandLineArguments: "",
        excludeArtwork: false,
      });
    } else {
      this.draft.exclusions.unshift(base);
    }
    this.newIds.add(base.id);
    this.changed();
    // Show it (first in the list, under the add button) and type its title.
    this.changeDetectorRef.detectChanges();
    const list: HTMLElement = this.elementRef.nativeElement.querySelector(
      ".userExceptions",
    );
    list
      ?.querySelector<HTMLElement>(".rule.isNew .matchTitle [contenteditable]")
      ?.focus({ preventScroll: true });
    // (instantly: a smooth scroll gets cancelled by the re-render)
    if (list) list.scrollTop = 0;
  }

  remove(rule: { id: string }) {
    this.newIds.delete(rule.id);
    if (this.tab === "exceptions") {
      this.draft.exceptions = this.draft.exceptions.filter((r) => r !== rule);
    } else {
      this.draft.exclusions = this.draft.exclusions.filter((r) => r !== rule);
    }
    this.changed();
  }

  removeAllInTab() {
    const rules =
      this.tab === "exceptions" ? this.draft.exceptions : this.draft.exclusions;
    for (const rule of rules) this.newIds.delete(rule.id);
    if (this.tab === "exceptions") this.draft.exceptions = [];
    else this.draft.exclusions = [];
    this.changed();
  }

  // "" (inherit) in the select is stored as no override.
  compatTool(rule: GameException) {
    return rule.compatToolName ?? "";
  }
  setCompatTool(rule: GameException, value: string) {
    if (value === "" || value === undefined) delete rule.compatToolName;
    else rule.compatToolName = value;
    this.changed();
  }

  save() {
    // Rules added by hand without a title match nothing: drop them.
    const data: UserExceptions = {
      exceptionsVersion: this.draft.exceptionsVersion,
      exceptions: this.draft.exceptions.filter(
        (r) => r.matchAppId !== undefined || r.matchTitle?.trim(),
      ),
      exclusions: this.draft.exclusions.filter(
        (r) => r.matchAppId !== undefined || r.matchTitle?.trim(),
      ),
    };
    const error = this.exceptionsService.validate(data);
    if (error) {
      this.loggerService.error(
        this.lang.error.cannotSave__i.interpolate({ error }),
        {
          invokeAlert: true,
          alertTimeout: 5000,
        },
      );
      return;
    }
    if (this.exceptionsService.save(data)) {
      this.load(this.exceptionsService.data);
    }
  }

  undo() {
    this.load(this.exceptionsService.data);
  }

  prettyDate(timeStamp: number) {
    return new Date(timeStamp).toLocaleString();
  }

  openDocs() {
    this.showMarkdown = true;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--markdown-width",
      "1fr",
      RendererStyleFlags2.DashCase,
    );
  }
  closeDocs() {
    this.showMarkdown = false;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--markdown-width",
      "0fr",
      RendererStyleFlags2.DashCase,
    );
  }

  private load(saved: UserExceptions) {
    this.draft = structuredClone(saved);
    delete this.draft.titles;
    this.newIds.clear();
    this.saved = JSON.stringify(this.draft);
    this.changed();
    this.changeDetectorRef.markForCheck();
  }

  private loadCompatTools() {
    const steamDir = this.appSettings.environmentVariables.steamDirectory;
    this.coreClient.client
      .call("support", "compatTools", steamDir ? [steamDir] : [])
      .then((tools: CompatToolInfo[]) => {
        this.compatToolOptions = [
          { displayValue: this.lang.compatTool.inherit, value: "" },
          { displayValue: this.lang.compatTool.none, value: COMPAT_NONE },
          ...tools.map((t) => ({ displayValue: t.displayName, value: t.name })),
        ];
        // keep tools the rules use that aren't installed here
        for (const rule of this.draft.exceptions) {
          const name = rule.compatToolName;
          if (name && !this.compatToolOptions.some((o) => o.value === name)) {
            this.compatToolOptions.push({ displayValue: name, value: name });
          }
        }
        this.changeDetectorRef.markForCheck();
      });
  }

  ngOnInit() {
    this.subscriptions.add(
      this.exceptionsService.dataObservable.subscribe((saved) => {
        // Saved rules changed (here, or from Add Games): take them, unless
        // there are edits here to keep.
        if (!this.isUnsaved || !this.saved) {
          this.load(saved);
        }
      }),
    );
    this.loadCompatTools();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
