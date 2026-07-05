import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  EventEmitter,
} from "@angular/core";
import { FormBuilder, FormGroup, FormControl } from "@angular/forms";
import {
  ParsersService,
  LanguageService,
  UserExceptionsService,
  SettingsService,
} from "../services";
import { UserConfiguration, AppSettings } from "../../models";
import { Subscription } from "rxjs";
import { APP } from "../../variables";
import { Router } from "@angular/router";

interface NavEntry {
  saved: UserConfiguration;
  current: UserConfiguration;
  globalIndex: number;
}

interface NavGroup {
  name: string; // "" for the implicit ungrouped section
  label: string;
  registryIndex: number; // index into appSettings.parserGroups; -1 for ungrouped
  isUngrouped: boolean;
  collapsed: boolean;
  entries: NavEntry[]; // filtered by the active search term
  total: number; // full membership count (ignores search)
  enabledCount: number; // full membership count (ignores search)
}

@Component({
  selector: "nav-parsers",
  templateUrl: "../templates/nav-parsers.component.html",
  styleUrls: ["../styles/nav-parsers.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavParsersComponent implements OnDestroy {
  userConfigurations: {
    saved: UserConfiguration;
    current: UserConfiguration;
  }[] = [];
  isExceptionsUnsaved: boolean = false;
  navForm: FormGroup;
  imageMap: { [k: string]: any } = {};
  private subscriptions: Subscription = new Subscription();
  private formSubscriptions: Subscription = new Subscription();
  appSettings: AppSettings;
  dragStartIndex: number = -1;
  dragStartGroupIndex: number = -1;
  currentId: string = "";

  groups: NavGroup[] = [];
  showUngroupedHeader: boolean = false;
  searchTerm: string = "";
  ungroupedCollapsed: boolean = false;
  addingGroup: boolean = false;
  renamingGroup: string | null = null;

  @Input() navClick: EventEmitter<any>;
  constructor(
    private parsersService: ParsersService,
    private languageService: LanguageService,
    private exceptionsService: UserExceptionsService,
    private router: Router,
    private settingsService: SettingsService,
    private changeRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
  ) {}

  get lang() {
    return APP.lang.nav.component;
  }
  get isEmuDeck() {
    return this.appSettings && this.appSettings.theme == "EmuDeck";
  }
  get searching() {
    return this.searchTerm.trim().length > 0;
  }

  ngOnInit() {
    this.appSettings = this.settingsService.getSettings();
    this.subscriptions.add(
      this.parsersService
        .getUserConfigurations()
        .subscribe((userConfigurations) => {
          this.userConfigurations = userConfigurations;
          if (this.isEmuDeck) {
            this.initializeImageMap(userConfigurations);
          }
          this.reconcileGroups();
          this.rebuild();
        }),
    );

    this.subscriptions.add(
      this.settingsService.getChangeObservable().subscribe(() => {
        this.appSettings = this.settingsService.getSettings();
        this.rebuild();
      }),
    );

    this.subscriptions.add(
      this.exceptionsService.isUnsavedObservable.subscribe((val: boolean) => {
        this.isExceptionsUnsaved = val;
        this.changeRef.detectChanges();
      }),
    );
    if (this.navClick) {
      this.subscriptions.add(
        this.navClick.subscribe(() => {
          this.currentId = "";
          this.changeRef.detectChanges();
        }),
      );
    }

    this.subscriptions.add(
      this.languageService.observeChanges().subscribe(() => {
        this.changeRef.detectChanges();
      }),
    );
  }

  // Ensure every group name referenced by a parser exists in the persisted
  // registry so headers, collapse state and ordering always have a home.
  private reconcileGroups() {
    const registry = this.parsersService.getParserGroups();
    const known = new Set(registry.map((g) => g.name));
    const missing: string[] = [];
    for (const config of this.userConfigurations) {
      const name = config.saved.group;
      if (name && !known.has(name)) {
        known.add(name);
        missing.push(name);
      }
    }
    for (const name of missing) {
      this.parsersService.addGroup(name);
    }
  }

  private rebuild() {
    this.buildGroups();
    this.buildNavForm();
    this.changeRef.detectChanges();
  }

  private buildGroups() {
    const term = this.searchTerm.trim().toLowerCase();
    const all: NavEntry[] = this.userConfigurations.map((config, i) => ({
      saved: config.saved,
      current: config.current,
      globalIndex: i,
    }));
    const matches = (entry: NavEntry) =>
      !term || (entry.saved.configTitle || "").toLowerCase().includes(term);
    const registry = this.parsersService.getParserGroups();

    const makeGroup = (
      name: string,
      registryIndex: number,
      isUngrouped: boolean,
    ): NavGroup => {
      const membersAll = all.filter((e) =>
        isUngrouped ? !e.saved.group : e.saved.group === name,
      );
      const collapsed = term
        ? false
        : isUngrouped
          ? this.ungroupedCollapsed
          : !!(registry[registryIndex] && registry[registryIndex].collapsed);
      return {
        name,
        label: isUngrouped ? "Ungrouped" : name,
        registryIndex,
        isUngrouped,
        collapsed,
        entries: membersAll.filter(matches),
        total: membersAll.length,
        enabledCount: membersAll.filter((e) => !e.saved.disabled).length,
      };
    };

    const groups: NavGroup[] = [];
    this.showUngroupedHeader = registry.length > 0;

    const ungrouped = makeGroup("", -1, true);
    if (ungrouped.total > 0 && (!term || ungrouped.entries.length > 0)) {
      groups.push(ungrouped);
    }
    registry.forEach((g, idx) => {
      const group = makeGroup(g.name, idx, false);
      if (!term || group.entries.length > 0) {
        groups.push(group);
      }
    });

    this.groups = groups;
  }

  private buildNavForm() {
    this.formSubscriptions.unsubscribe();
    this.formSubscriptions = new Subscription();

    const configs = this.userConfigurations;
    const someOn = configs.length
      ? configs.map((c) => !c.saved.disabled).reduce((x, y) => x || y)
      : false;

    // Build group toggle controls from the full (unfiltered) group set so that
    // a control always exists for every group regardless of the active search.
    const registry = this.parsersService.getParserGroups();
    const groupDescriptors: { key: string; name: string; someOn: boolean }[] = [
      {
        key: "__ungrouped__",
        name: "",
        someOn: configs.some((c) => !c.saved.group && !c.saved.disabled),
      },
      ...registry.map((g) => ({
        key: g.name,
        name: g.name,
        someOn: configs.some(
          (c) => c.saved.group === g.name && !c.saved.disabled,
        ),
      })),
    ];

    this.navForm = this.formBuilder.group({
      selectAll: someOn,
      parserStatuses: this.formBuilder.group(
        Object.fromEntries(
          configs.map((c) => [c.saved.parserId, !c.saved.disabled]),
        ),
      ),
      groupStatuses: this.formBuilder.group(
        Object.fromEntries(groupDescriptors.map((g) => [g.key, g.someOn])),
      ),
    });

    this.formSubscriptions.add(
      this.navForm.get("selectAll").valueChanges.subscribe((val: boolean) => {
        if (
          !val ||
          this.userConfigurations
            .map((config) => config.saved.disabled)
            .reduce((x, y) => x && y, true)
        ) {
          this.parsersService.changeEnabledStatusAll(val);
        }
      }),
    );

    const parserControls = this.getParserControls();
    for (const config of configs) {
      const parserId = config.saved.parserId;
      this.formSubscriptions.add(
        parserControls[parserId].valueChanges.subscribe((val: boolean) => {
          this.parsersService.changeEnabledStatus(parserId, val);
        }),
      );
    }

    const groupControls = this.getGroupControls();
    for (const descriptor of groupDescriptors) {
      this.formSubscriptions.add(
        groupControls[descriptor.key].valueChanges.subscribe((val: boolean) => {
          this.parsersService.changeGroupEnabledStatus(descriptor.name, val);
        }),
      );
    }
  }

  groupControlKey(group: NavGroup) {
    return group.isUngrouped ? "__ungrouped__" : group.name;
  }

  getParserControls() {
    return (this.navForm.get("parserStatuses") as FormGroup).controls;
  }

  getGroupControls() {
    return (this.navForm.get("groupStatuses") as FormGroup).controls;
  }

  flipAll() {
    this.navForm
      .get("selectAll")
      .setValue(!this.navForm.get("selectAll").value);
  }

  emuClick(control: FormControl) {
    control.setValue(!control.value);
  }

  onClick(index: number, parserId: string) {
    this.router.navigate(["/parsers", index]);
    this.currentId = parserId;
  }

  // ---- Search -------------------------------------------------------------
  onSearch(term: string) {
    this.searchTerm = term || "";
    this.buildGroups();
    this.changeRef.detectChanges();
  }

  clearSearch() {
    this.onSearch("");
  }

  // ---- Group management ---------------------------------------------------
  toggleCollapse(group: NavGroup) {
    if (this.searching) {
      return;
    }
    if (group.isUngrouped) {
      this.ungroupedCollapsed = !this.ungroupedCollapsed;
      this.buildGroups();
      this.changeRef.detectChanges();
    } else {
      this.parsersService.setGroupCollapsed(group.name, !group.collapsed);
    }
  }

  startAddGroup() {
    this.addingGroup = true;
    this.changeRef.detectChanges();
  }

  confirmAddGroup(name: string) {
    this.addingGroup = false;
    this.parsersService.addGroup(name);
  }

  cancelAddGroup() {
    this.addingGroup = false;
    this.changeRef.detectChanges();
  }

  startRename(group: NavGroup, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (group.isUngrouped) {
      return;
    }
    this.renamingGroup = group.name;
    this.changeRef.detectChanges();
  }

  confirmRename(group: NavGroup, newName: string) {
    this.renamingGroup = null;
    this.parsersService.renameGroup(group.name, newName);
  }

  cancelRename() {
    this.renamingGroup = null;
    this.changeRef.detectChanges();
  }

  deleteGroup(group: NavGroup, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (group.isUngrouped) {
      return;
    }
    this.parsersService.removeGroup(group.name);
  }

  // ---- Drag & drop --------------------------------------------------------
  dragStart(entry: NavEntry) {
    this.dragStartIndex = this.getRouteIndex(this.router.url);
  }

  getRouteIndex(route: string) {
    return parseInt(route.split("/")[2]);
  }

  // Drop an entry onto another entry (reorder or move across groups).
  handleEntryDrop(dropData: any, target: NavEntry, group: NavGroup) {
    if (!dropData || dropData.type !== "entry") {
      return;
    }
    this.performEntryMove(dropData.fromIndex, target.globalIndex, group.name);
  }

  // Drop an entry onto a group header / empty area (append to the group).
  handleEntryDropToGroup(dropData: any, group: NavGroup) {
    if (!dropData || dropData.type !== "entry") {
      return;
    }
    const members = this.userConfigurations
      .map((c, i) => ({ group: c.saved.group || "", index: i }))
      .filter((m) => m.group === group.name);
    const toIndex = members.length
      ? members[members.length - 1].index + 1
      : this.userConfigurations.length;
    this.performEntryMove(dropData.fromIndex, toIndex, group.name);
  }

  private performEntryMove(
    fromIndex: number,
    toIndex: number,
    targetGroup: string,
  ) {
    this.parsersService.moveParser(fromIndex, toIndex, targetGroup);
    // Keep the currently open parser's route pointing at the same parser.
    if (fromIndex < this.dragStartIndex && this.dragStartIndex <= toIndex) {
      this.router.navigate(["/parsers", this.dragStartIndex - 1]);
    } else if (
      toIndex <= this.dragStartIndex &&
      this.dragStartIndex < fromIndex
    ) {
      this.router.navigate(["/parsers", this.dragStartIndex + 1]);
    } else if (this.dragStartIndex == fromIndex) {
      this.router.navigate([
        "/parsers",
        Math.min(toIndex, this.userConfigurations.length - 1),
      ]);
    }
  }

  groupDragStart(group: NavGroup) {
    this.dragStartGroupIndex = group.registryIndex;
  }

  handleGroupDrop(dropData: any, targetGroup: NavGroup) {
    if (!dropData || dropData.type !== "group" || targetGroup.isUngrouped) {
      return;
    }
    this.parsersService.reorderGroups(
      dropData.fromGroupIndex,
      targetGroup.registryIndex,
    );
  }

  // Unified drop handlers used by the droppable zones in the template.
  onEntryZoneDrop(dropData: any, target: NavEntry, group: NavGroup) {
    if (dropData && dropData.type === "entry") {
      this.handleEntryDrop(dropData, target, group);
    }
  }

  onGroupZoneDrop(dropData: any, group: NavGroup) {
    if (dropData && dropData.type === "group") {
      this.handleGroupDrop(dropData, group);
    } else if (dropData && dropData.type === "entry") {
      this.handleEntryDropToGroup(dropData, group);
    }
  }

  initializeImageMap(
    userConfigurations: {
      current: UserConfiguration;
      saved: UserConfiguration;
    }[],
  ) {
    for (let userConfiguration of userConfigurations) {
      let separatedValues: string[] =
        userConfiguration.saved.configTitle.split(" - ");
      let separatedValuesImg = separatedValues.length
        ? separatedValues[0].replaceAll(/[\/\-\(\)\.\s]/g, "")
        : "";
      separatedValuesImg = separatedValuesImg
        .replaceAll("3do", "p3do")
        .toLowerCase();
      let imgValue = "";
      let alternativeValue = false;
      let detailsValue = "";
      try {
        imgValue = require(`../../assets/systems/${separatedValuesImg}.svg`);
        detailsValue = userConfiguration.saved.configTitle
          .split(" - ")
          .slice(1)
          .join(" - ");
      } catch (e) {
        alternativeValue = true;
        detailsValue = userConfiguration.saved.configTitle;
      }
      this.imageMap[userConfiguration.saved.parserId] = {
        alternative: alternativeValue,
        details: detailsValue,
        img: imgValue,
      };
    }
  }

  ngOnDestroy() {
    this.formSubscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
