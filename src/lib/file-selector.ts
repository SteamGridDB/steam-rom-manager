export class FileSelector {
  private fileInput: HTMLInputElement = undefined;
  private callback: (target: HTMLInputElement, event?: Event) => void =
    undefined;

  constructor() {
    this.fileInput = document.createElement("input");
    this.fileInput.setAttribute("type", "file");
    this.fileInput.onchange = (event: Event) => {
      if (this.callback) this.callback(this.fileInput, event);

      this.fileInput.value = null;
    };
  }

  set accept(value: string) {
    this.fileInput.setAttribute("accept", value || "");
  }

  set multiple(value: boolean) {
    this.fileInput.setAttribute("multiple", value ? "true" : "");
  }

  set directory(value: boolean) {
    this.fileInput.setAttribute("webkitdirectory", value ? "true" : "");
  }

  set onChange(callback: (target: HTMLInputElement, event: Event) => void) {
    this.callback = callback;
  }

  trigger() {
    this.fileInput.click();
  }
}
