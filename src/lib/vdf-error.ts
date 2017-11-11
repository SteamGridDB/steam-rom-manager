const noError: string = 'No error has occurred...'

export class VDF_Error {
    private text: string = undefined;

    constructor(messages: string | string[] | VDF_Error | VDF_Error[] | Error | Error[]) {
        if (typeof messages === 'string')
            this.text = messages;
        else if (messages instanceof VDF_Error || messages instanceof Error)
            this.text = messages.message;
        else if (messages instanceof Array) {
            messages = (messages as any[]).filter(error => error !== undefined && error !== null);
            if (messages.length > 0) {
                if (typeof messages[0] === 'string')
                    this.text = (messages as string[]).join('\r\n');
                else if (messages[0] instanceof VDF_Error || messages[0] instanceof Error) {
                    this.text = (messages as any[]).map(error => error.message).join('\r\n');
                }
            }
        }
    }

    get valid(){
        return this.text !== undefined;
    }

    get invalid(){
        return !this.valid;
    }

    get message() {
        return this.text || noError;
    }

    get error() {
        return new Error(this.text);
    }
}