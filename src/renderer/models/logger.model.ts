export interface LogMessage {
    timestamp: string,
    type: string,
    text: string
};

export interface LogSettings {
    showErrors: boolean,
    showSuccesses: boolean,
    showInfo: boolean,
    showFuzzy: boolean,
    timestamp: boolean,
    textWrap: boolean,
    autoscroll: boolean,
    currentScrollValue: number
};

export interface MessageSettings {
    invokeAlert?: boolean,
    alertTimeout?: number,
    keepAfterNavigationChange?: boolean,
    doNotAppendToLog?: boolean
}