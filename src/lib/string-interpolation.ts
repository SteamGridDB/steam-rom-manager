import * as _ from "lodash";

declare global {
  interface String {
    interpolate(params: { [key: string]: any }): string;
    startCase(): string;
  }
}

String.prototype.interpolate = function (params: any) {
  const names = _.keys(params);
  const vals = _.values(params);
  return new Function(...names, `return \`${this}\`;`)(...vals);
};

String.prototype.startCase = function () {
  return this.split(/\s/g)
    .map((w: string) => _.capitalize(w))
    .join(" ");
};
