'use strict';

module.exports = function (source) {
    var re = new RegExp(/\[(.*?)\](\:\s+|\()(?!http|#)(.+?)(?:(\s.*?)(?=\))|)(\)|\s)/, 'g');
    return source.replace(re, '[$1]$2require("$3")$4$5');
};