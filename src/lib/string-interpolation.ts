import * as _ from "lodash";

declare global {
  interface String {
    interpolate(params: { [key: string]: any }): string;
    startCase(): string;
  }
}

// Replaces `${name}` placeholders with params[name]. Only plain identifiers
// are substituted; nothing in the string is evaluated (language strings come
// from translators). Unknown placeholders are left as they are.
String.prototype.interpolate = function (params: { [key: string]: any }) {
  return this.replace(
    /\$\{([A-Za-z_$][\w$]*)\}/g,
    (placeholder: string, name: string) =>
      Object.prototype.hasOwnProperty.call(params, name)
        ? String(params[name])
        : placeholder,
  );
};

String.prototype.startCase = function () {
  return this.split(/\s/g)
    .map((w: string) => _.capitalize(w))
    .join(" ");
};
