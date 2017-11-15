const noError: string = 'No error has occurred...';

function toMessage(messages: string | string[] | VDF_Error | VDF_Error[] | Error | Error[]) {
    let message = undefined;

    if (typeof messages === 'string')
        message = messages;
    else if (messages instanceof VDF_Error || messages instanceof Error)
        message = messages.message;
    else if (messages instanceof Array) {
        messages = (messages as any[]).filter(error => error !== undefined && error !== null);
        if (messages.length > 0) {
            if (typeof messages[0] === 'string')
                message = (messages as string[]).join('\r\n');
            else if (messages[0] instanceof VDF_Error || messages[0] instanceof Error) {
                message = (messages as any[]).map(error => error.message).join('\r\n');
            }
        }
    }

    return message;
}

export class VDF_Error extends Error {
    private isValid: boolean;

    constructor(messages: string | string[] | VDF_Error | VDF_Error[] | Error | Error[]) {
        let message = toMessage(messages);
        super(message);
        this.isValid = message !== undefined;
    }

    get valid() {
        return this.isValid;
    }

    get invalid() {
        return !this.valid;
    }
}