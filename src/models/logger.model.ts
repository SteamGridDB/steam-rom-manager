export interface LogMessage {
  type: string;
  text: string;
}

export interface LogSettings {
  showErrors: boolean;
  showSuccesses: boolean;
  showInfo: boolean;
  showFuzzy: boolean;
  textWrap: boolean;
  autoscroll: boolean;
  currentScrollValue: number;
}

export interface MessageSettings {
  invokeAlert?: boolean;
  alertTimeout?: number;
  doNotAppendToLog?: boolean;
}

// What non-UI code needs from a logger. LoggerService implements it in the
// renderer; the core supplies its own (e.g. forwarding to the UI or stdout).
export interface Logger {
  info(message: any, settings?: MessageSettings): void;
  success(message: any, settings?: MessageSettings): void;
  error(message: any, settings?: MessageSettings): void;
}
