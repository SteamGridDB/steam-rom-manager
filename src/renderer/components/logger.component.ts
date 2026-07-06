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

  // Find-in-output (Cmd/Ctrl+F) state.
  findOpen: boolean = false;
  findTerm: string = "";
  matchIndices: number[] = [];
  activeMatchIndex: number = 0;
  private cachedMessages: LogMessage[] = [];

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
      this.cachedMessages = logMessages || [];
      if (this.findOpen) {
        this.recomputeMatches(false);
      }
      this.changeDetectionRef.detectChanges();
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
    this.recomputeMatches(true);
    this.changeDetectionRef.detectChanges();
    setTimeout(() => {
      if (this.findInput) {
        this.findInput.nativeElement.focus();
        this.findInput.nativeElement.select();
      }
    });
  }

  closeFind() {
    this.findOpen = false;
    this.changeDetectionRef.detectChanges();
  }

  onFind(term: string) {
    this.findTerm = term || "";
    this.recomputeMatches(true);
  }

  private recomputeMatches(resetActive: boolean) {
    const term = this.findTerm.trim().toLowerCase();
    this.matchIndices = [];
    if (term) {
      this.cachedMessages.forEach((message, index) => {
        if (
          this.canShow(message.type) &&
          (message.text || "").toLowerCase().includes(term)
        ) {
          this.matchIndices.push(index);
        }
      });
    }
    if (resetActive) {
      this.activeMatchIndex = 0;
    } else {
      this.activeMatchIndex = Math.min(
        this.activeMatchIndex,
        Math.max(0, this.matchIndices.length - 1),
      );
    }
    this.changeDetectionRef.detectChanges();
    if (this.matchIndices.length) {
      this.scrollToActiveMatch();
    }
  }

  nextMatch() {
    if (!this.matchIndices.length) {
      return;
    }
    this.activeMatchIndex =
      (this.activeMatchIndex + 1) % this.matchIndices.length;
    this.changeDetectionRef.detectChanges();
    this.scrollToActiveMatch();
  }

  prevMatch() {
    if (!this.matchIndices.length) {
      return;
    }
    this.activeMatchIndex =
      (this.activeMatchIndex - 1 + this.matchIndices.length) %
      this.matchIndices.length;
    this.changeDetectionRef.detectChanges();
    this.scrollToActiveMatch();
  }

  private scrollToActiveMatch() {
    const messageIndex = this.matchIndices[this.activeMatchIndex];
    if (messageIndex === undefined || !this.messageWindow) {
      return;
    }
    setTimeout(() => {
      const el = this.messageWindow.nativeElement.querySelector(
        `#logmsg-${messageIndex}`,
      );
      if (el) {
        el.scrollIntoView({ block: "center" });
      }
    });
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
