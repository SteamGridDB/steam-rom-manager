const noError: string = 'No error has occurred...';

function toMessage(messages: string | Category_Error |  Error) {
    let message = undefined;
    if (typeof messages === 'string')
        message = messages;
    else if (messages instanceof Category_Error || messages instanceof Error)
        message = messages.message;
    return message;
}

export class Category_Error extends Error {
    private isValid: boolean;

    constructor(messages: string | Category_Error | Error) {
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
