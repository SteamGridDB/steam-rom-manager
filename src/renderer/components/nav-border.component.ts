import { AppSettings } from "../../models";
import { SettingsService } from "../services";
import { Component, HostListener, Renderer2 } from "@angular/core";

@Component({
  selector: "nav-border",
  template: "",
  styleUrls: ["../styles/nav-border.component.scss"],
  host: {
    "[class.dragging]": "isDragging",
  },
})
export class NavBorderComponent {
  private isDragging = false;
  private appSettings: AppSettings;

  constructor(
    private renderer: Renderer2,
    private settingsService: SettingsService,
  ) {
    this.appSettings = this.settingsService.getSettings();
  }

  ngOnInit() {
    if (this.appSettings.theme !== "EmuDeck") {
      this.setWidth(this.appSettings.navigationWidth);
    }
  }

  setWidth(width: number) {
    if (width !== 0) {
      document.documentElement.style.setProperty(
        "--nav-width",
        `${width < 0 ? 0 : width}px`,
      );
    }
  }

  saveWidth(width: number) {
    this.appSettings.navigationWidth = width < 0 ? 0 : width;
    this.settingsService.saveAppSettings();
  }

  @HostListener("dragstart", ["$event"])
  private onDragStart(event: DragEvent) {
    return false;
  }

  @HostListener("mousedown", ["$event"])
  private onMousedown(event: MouseEvent) {
    document.documentElement.style.setProperty("pointer-events", "none");
    document.documentElement.style.setProperty("cursor", "ew-resize");
    this.isDragging = true;
  }

  @HostListener("document:mouseup", ["$event"])
  private onMouseup(event: MouseEvent) {
    if (this.isDragging) {
      document.documentElement.style.setProperty("pointer-events", "auto");
      document.documentElement.style.setProperty("cursor", "initial");
      this.saveWidth(event.clientX);
      this.isDragging = false;
    }
  }

  @HostListener("document:mousemove", ["$event"])
  private onMousemove(event: DragEvent) {
    if (this.isDragging) {
      this.setWidth(event.clientX);
      event.stopPropagation();
      event.preventDefault();
    }
  }
}
