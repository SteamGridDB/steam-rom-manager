type General_Error = string | Error | VDF_Error;

export class VDF_Error extends Error {
  private isValid: boolean;
  nonFatal: boolean;

  constructor(
    messages: General_Error | General_Error[],
    title?: string,
    nonFatal?: boolean,
  ) {
    let message = VDF_Error.toMessage(messages, title);
    super(message);
    this.isValid =
      [].concat(messages).filter((message) => !!message).length > 0;
    this.nonFatal = !!nonFatal;
  }

  get valid() {
    return this.isValid;
  }

  get invalid() {
    return !this.valid;
  }

  static toMessage(messages: General_Error | General_Error[], title?: string) {
    return (title ? [title] : ([] as General_Error[]))
      .concat(messages)
      .filter((message: General_Error) => !!message)
      .map((message: General_Error) => {
        if (typeof message === "string") {
          return message;
        } else {
          return message.message;
        }
      })
      .join("\r\n");
  }
}
