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
