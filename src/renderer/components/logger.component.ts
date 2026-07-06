import {
  Component,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Renderer2,
  RendererStyleFlags2,
  HostListener,
} from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { LoggerService, SettingsService } from "../services";
import { AppSettings, LogMessage, LogSettings } from "../../models";
import { Observable } from "rxjs";
import { APP } from "../../variables";
import { clipboard } from "electron";

import * as fs from "fs-extra";

@Component({
  selector: "log",

  templateUrl: "../templates/logger.component.html",
  styleUrls: ["../styles/logger.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoggerComponent {
  messages: Observable<LogMessage[]>;
  settings: LogSettings;
  appSettings: AppSettings;
  explanation: string;
  showOptions: boolean = false;
  reportID: string;
  deleteKey: string;
  useVDFs: boolean = false;
  description: string = "";
  discordHandle: string = "";
  bugForm: FormGroup;
  showReporter: boolean = false;

  // Find-in-output (Cmd/Ctrl+F) state. Navigation is over the actual <mark>
  // elements the highlight pipe produces, so a single multi-line log message
  // (like the whole test output) can contain many individually-navigable hits.
  findOpen: boolean = false;
  findTerm: string = "";
  matchCount: number = 0;
  activeMatch: number = 0;
  private markEls: HTMLElement[] = [];

  @ViewChild("messageWindow") private messageWindow: ElementRef;
  @ViewChild("findInput") private findInput: ElementRef;

  constructor(
    private loggerService: LoggerService,
    private changeDetectionRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private settingsService: SettingsService,
  ) {
    this.settings = this.loggerService.getLogSettings();
    this.appSettings = this.settingsService.getSettings();
    this.messages = this.loggerService.getLogMessages();
    this.explanation = this.lang.docs__md.self.join(" ");

    this.bugForm = formBuilder.group({
      description: formBuilder.control(""),
      discordHandle: formBuilder.control(""),
      useVDFs: formBuilder.control(false),
      steamDirectory: formBuilder.control(""),
    });
  }

  get lang() {
    return APP.lang.logger.component;
  }

  ngAfterViewInit() {
    this.messages.subscribe((logMessages: LogMessage[]) => {
      this.changeDetectionRef.detectChanges();
      if (this.findOpen) {
        // New log lines may add/remove matches; re-collect the marks.
        this.collectMarks(false);
      }
    });
    if (this.settings.currentScrollValue && this.messageWindow)
      this.messageWindow.nativeElement.scrollTop =
        this.settings.currentScrollValue;
  }

  ngAfterViewChecked() {
    if (this.messageWindow) {
      // Don't yank the view to the bottom while the user is searching.
      if (this.settings.autoscroll && !this.findOpen)
        this.messageWindow.nativeElement.scrollTop =
          this.messageWindow.nativeElement.scrollHeight;
      this.settings.currentScrollValue =
        this.messageWindow.nativeElement.scrollTop;
    }
  }

  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      this.openFind();
    } else if (event.key === "Escape" && this.findOpen) {
      this.closeFind();
    }
  }

  openFind() {
    this.findOpen = true;
    this.changeDetectionRef.detectChanges();
    setTimeout(() => {
      if (this.findInput) {
        this.findInput.nativeElement.focus();
        this.findInput.nativeElement.select();
      }
    });
    this.collectMarks(true);
  }

  closeFind() {
    this.findOpen = false;
    this.markEls.forEach((el) => el.classList.remove("activeFindMark"));
    this.markEls = [];
    this.matchCount = 0;
    this.changeDetectionRef.detectChanges();
  }

  onFind(term: string) {
    this.findTerm = term || "";
    this.changeDetectionRef.detectChanges();
    this.collectMarks(true);
  }

  // Re-scan the rendered output for the <mark> elements produced by the
  // highlight pipe and set up navigation over each individual occurrence.
  private collectMarks(resetActive: boolean) {
    setTimeout(() => {
      const container = this.messageWindow
        ? this.messageWindow.nativeElement
        : undefined;
      this.markEls = container
        ? (Array.from(container.querySelectorAll("mark")) as HTMLElement[])
        : [];
      this.matchCount = this.markEls.length;
      if (resetActive || this.activeMatch >= this.matchCount) {
        this.activeMatch = 0;
      }
      this.applyActiveMark(true);
      this.changeDetectionRef.detectChanges();
    });
  }

  private applyActiveMark(scroll: boolean) {
    this.markEls.forEach((el, i) =>
      el.classList.toggle("activeFindMark", i === this.activeMatch),
    );
    if (scroll && this.markEls[this.activeMatch]) {
      this.markEls[this.activeMatch].scrollIntoView({ block: "center" });
    }
  }

  nextMatch() {
    if (!this.matchCount) {
      return;
    }
    this.activeMatch = (this.activeMatch + 1) % this.matchCount;
    this.applyActiveMark(true);
    this.changeDetectionRef.detectChanges();
  }

  prevMatch() {
    if (!this.matchCount) {
      return;
    }
    this.activeMatch =
      (this.activeMatch - 1 + this.matchCount) % this.matchCount;
    this.applyActiveMark(true);
    this.changeDetectionRef.detectChanges();
  }

  canShow(type: string) {
    switch (type) {
      case "error":
        return this.settings.showErrors;
      case "info":
        return this.settings.showInfo;
      case "success":
        return this.settings.showSuccesses;
      case "fuzzy":
        return this.settings.showFuzzy;
      default:
        return false;
    }
  }

  submitReport() {
    let description: string = this.bugForm.controls.description.value;
    let discordHandle: string = this.bugForm.controls.discordHandle.value;
    let useVDFs = this.bugForm.controls.useVDFs.value;
    let steamDirectory = this.bugForm.controls.steamDirectory.value;
    if (!description) {
      this.loggerService.error(
        `Description cannot be blank. Please describe your issue.`,
      );
      return;
    }
    if (useVDFs && (!steamDirectory || !fs.existsSync(steamDirectory))) {
      this.loggerService.error(
        `Valid steam directory is required to upload VDFs`,
      );
      return;
    }
    this.loggerService
      .submitReport(description, useVDFs, discordHandle, steamDirectory)
      .then(({ key, deleteKey }: { key: string; deleteKey: string }) => {
        this.reportID = key;
        this.deleteKey = deleteKey;
        this.changeDetectionRef.detectChanges();
      })
      .catch((err) => {
        this.loggerService.error(`Could not upload bug report:\n ${err}`);
      });
  }

  copyReportID() {
    clipboard.writeText(this.reportID);
  }

  copyDeleteKey() {
    clipboard.writeText(this.deleteKey);
  }

  clearLog() {
    this.loggerService.clearLog();
  }

  closeOptions() {
    this.showOptions = false;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--options-width",
      "0%",
      RendererStyleFlags2.DashCase,
    );
  }

  openOptions() {
    this.showOptions = true;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--options-width",
      "300px",
      RendererStyleFlags2.DashCase,
    );
  }

  toggleOptions() {
    if (this.showOptions) {
      this.closeOptions();
    } else {
      this.openOptions();
    }
    this.changeDetectionRef.detectChanges();
  }

  openReporter() {
    this.showReporter = true;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--reporter-width",
      "1fr",
      RendererStyleFlags2.DashCase,
    );
  }
  closeReporter() {
    this.showReporter = false;
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      "--reporter-width",
      "0fr",
      RendererStyleFlags2.DashCase,
    );
  }
}
