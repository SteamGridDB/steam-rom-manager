export class Acceptable_Error extends Error {
  constructor(messages: string | Acceptable_Error | Error) {
    let message = Acceptable_Error.toMessage(messages);
    super(message);
  }

  static toMessage(messages: string | Acceptable_Error | Error) {
    let message = undefined;
    if (typeof messages === "string") {
      message = messages;
    } else if (
      messages instanceof Acceptable_Error ||
      messages instanceof Error
    ) {
      message = messages.message;
    }
    return message;
  }
}
