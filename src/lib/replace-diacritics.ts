const diacriticList = require("./diacritic.json");

declare global {
  interface String {
    replaceDiacritics(): string;
  }
}

String.prototype.replaceDiacritics = function () {
  return (this as String).replace(/[^A-Za-z0-9 ]/g, function (char) {
    return diacriticList[char] || char;
  });
};

export default undefined;
