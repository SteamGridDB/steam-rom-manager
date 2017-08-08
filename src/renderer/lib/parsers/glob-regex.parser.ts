import { Parser, GenericParser, UserConfiguration, ParsedData } from '../../models';
import { gApp } from "../../app.global";
import * as _ from "lodash";
import * as minimatch from 'minimatch';
import * as glob from 'glob';
import * as path from 'path';

interface TitleTagData {
    depth: {
        direction: 'left' | 'right',
        level: number
    },
    finalGlob: string,
    globRegex: {
        regex: RegExp,
        replaceText: string
    }
    titleRegex: {
        regex: RegExp,
        pos: number
    }
}

export class GlobRegexParser implements GenericParser {
    getParser(): Parser {
        return {
            title: this.lang.title,
            info: this.lang.docs__md.self.join(''),
            inputs: {
                'glob-regex': {
                    label: this.lang.inputTitle,
                    validationFn: this.validate.bind(this),
                    info: this.lang.docs__md.input.join('')
                }
            }
        };
    }

    private get lang() {
        return gApp.lang.globRegexParser;
    }

    private validate(fileGlob: string) {
        let testRegExpr = /\${\/(.+)\/([ui]{0,2})(?:\|(.+?))?}/i;
        let match = testRegExpr.exec(fileGlob);
        if (match === null)
            return this.lang.errors.noRegex;

        testRegExpr = /\${.*?}/i;
        match = testRegExpr.exec(fileGlob);
        if (match.length > 1)
            return this.lang.errors.moreThanOneRegex;

        testRegExpr = /.*\*\${.*?}.*|.*\${.*?}\*.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return this.lang.errors.noStarNextToRegex;

        testRegExpr = /.*\?\${.*?}.*|.*\${.*?}\?.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return this.lang.errors.noAnyCharNextToRegex;

        let fileGlobWithoutRegex = fileGlob.replace(/\${.*?}/i, '');

        testRegExpr = /\\/i;
        match = testRegExpr.exec(fileGlobWithoutRegex);
        if (match !== null)
            return this.lang.errors.noWindowsSlash;

        testRegExpr = /.*\*\*.+\${.*?}.+\*\*.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return this.lang.errors.noGlobstarOnBothSides;

        testRegExpr = /.*\{.*?\/+.*?\}.*\${.*?}.*\{.*?\/+.*?\}.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return this.lang.errors.noBracedDirSetOnBothSides;

        testRegExpr = /.*\{.*?\/+.*?\}.*\${.*?}.+\*\*.*|.*\*\*.+\${.*?}.*\{.*?\/+.*?\}.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return this.lang.errors.noBracedDirSetOrGlobstarOnBothSides;

        testRegExpr = /(\?|!|\+|\*|@)\((.*?)\)/gi;
        while ((match = testRegExpr.exec(fileGlobWithoutRegex)) !== null) {
            if (match[2].length === 0)
                return this.lang.errors.noEmptyPattern;
        }

        testRegExpr = /\[(.*?)\]/g;
        while ((match = testRegExpr.exec(fileGlobWithoutRegex)) !== null) {
            if (match[1].length === 0)
                return this.lang.errors.noEmptyCharRange;
        }

        testRegExpr = /.*(\?|!|\+|\*|@)\((.+?)\)\${.*?}(\?|!|\+|\*|@)\((.+?)\).*|.*(\?|!|\+|\*|@)\((.+?)\)\${.*?}.*|.*\${.*?}(\?|!|\+|\*|@)\((.+?)\).*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null) {
            let patterns: string[];
            if (match[2] || match[6]) {
                patterns = (match[2] || match[6]).split('|');
                for (let i = 0; i < patterns.length; i++) {
                    if (patterns[i][patterns[i].length - 1] === '*')
                        return this.lang.errors.noStarInPatternNextToRegex;
                    else if (patterns[i][patterns[i].length - 1] === '?')
                        return this.lang.errors.noAnyCharInPatternNextToRegex;
                }
            }
            else if (match[4] || match[8]) {
                patterns = (match[4] || match[8]).split('|');
                for (let i = 0; i < patterns.length; i++) {
                    if (patterns[i][0] === '*')
                        return this.lang.errors.noStarInPatternNextToRegex;
                    else if (patterns[i][0] === '?')
                        return this.lang.errors.noAnyCharInPatternNextToRegex;
                }
            }
        }

        return null;
    }

    private getTitleDepth(fileGlob: string) {
        let depth: { direction: 'left' | 'right', level: number } = { direction: undefined, level: undefined };
        let tempGlob = undefined;
        if (fileGlob.replace(/\${.*?}/i, '').length === 0) {
            depth.level = null;
        }
        else if (/.*\*\*.+\${.*?}.*/i.test(fileGlob)) {
            depth.direction = 'right';
            tempGlob = fileGlob.replace(/.*\${.*?}/i, '');
        }
        else {
            depth.direction = 'left';
            tempGlob = fileGlob.replace(/\${.*?}.*/i, '');
        }

        if (depth.level === undefined) {
            let dirMatch = tempGlob.match(/\//g);
            depth.level = dirMatch === null ? 0 : dirMatch.length;
        }

        return depth;
    }

    private getTitleRegex(fileGlob: string) {
        let titleRegex = '';
        let pos = 1;

        let titleSegmentMatch = fileGlob.match(/.*\/(.*\${.*?}.*?)\/|.*\/(.*\${.*?}.*)|(.*\${.*?}.*?)\/|(.*\${.*?}.*)/i);
        if (titleSegmentMatch !== null) {
            let titleSegments = (titleSegmentMatch[1] || titleSegmentMatch[2] || titleSegmentMatch[3] || titleSegmentMatch[4]).split(/\${.*?}/i);
            if (titleSegments[0].length > 0) {
                let regexString = new minimatch.Minimatch(titleSegments[0], { dot: true }).makeRe().source;
                titleRegex += regexString.substr(0, regexString.length - 1);
                pos++;
            }
            else
                titleRegex += '^';

            titleRegex += '(.*?)';

            if (titleSegments[1].length > 0) {
                let regexString = new minimatch.Minimatch(titleSegments[1], { dot: true }).makeRe().source;
                titleRegex += regexString.substr(1, regexString.length - 1);
            }
            else
                titleRegex += '$';
        }

        return { regex: new RegExp(titleRegex), pos: pos };
    }

    private getFinalGlob(fileGlob: string, depthLevel: number) {
        if (depthLevel !== null) {
            return fileGlob.replace(/(\${.*?})/i, '*')
        }
        else
            return '**';
    }

    private makeRegexRegex(fileGlob: string) {
        let match = /\${\/(.+)\/([ui]{0,2})(?:\|(.+?))?}/.exec(fileGlob);
        if (match) {
            return { regex: new RegExp(match[1], match[2] || ''), replaceText: match[3] || '' };
        }
        else
            return { regex: new RegExp(''), replaceText: '' };
    }

    private extractTitleTag(fileGlob: string) {
        let extractedData: TitleTagData = { finalGlob: undefined, globRegex: undefined, titleRegex: undefined, depth: undefined };
        extractedData.depth = this.getTitleDepth(fileGlob);
        extractedData.titleRegex = this.getTitleRegex(fileGlob);
        extractedData.finalGlob = this.getFinalGlob(fileGlob, extractedData.depth.level);
        extractedData.globRegex = this.makeRegexRegex(fileGlob);
        return extractedData;
    }

    private extractTitle(titleData: TitleTagData, file: string) {
        if (titleData.depth.level !== null) {
            let fileSections = file.split('/');
            file = fileSections[titleData.depth.direction === 'right' ? fileSections.length - (titleData.depth.level + 1) : titleData.depth.level];
        }

        if (file !== undefined) {
            let titleMatch = file.match(titleData.titleRegex.regex);
            if (titleMatch !== null && titleMatch[titleData.titleRegex.pos]) {
                if (titleData.globRegex.replaceText.length > 0) {
                    return titleMatch[titleData.titleRegex.pos].replace(titleData.globRegex.regex, titleData.globRegex.replaceText).replace(/\//g, path.sep).trim();
                }
                else {
                    titleMatch = titleMatch[titleData.titleRegex.pos].match(titleData.globRegex.regex);
                    if (titleMatch !== null) {
                        let title: string = '';
                        for (let i = 1; i < titleMatch.length; i++) {
                            if (titleMatch[i])
                                title += titleMatch[i];
                        }
                        if (title.length === 0)
                            return titleMatch[0].replace(/\//g, path.sep).trim();
                        else
                            return title.replace(/\//g, path.sep).trim();
                    }
                }
            }
        }
        return undefined;
    }

    private extractTitles(titleData: TitleTagData, directory: string, files: string[]) {
        let parsedData: ParsedData = { success: [], failed: [] };
        for (let i = 0; i < files.length; i++) {
            let title = this.extractTitle(titleData, files[i]);
            let filepath = files[i].replace(/\\|\//g, path.sep);
            if (title !== undefined)
                parsedData.success.push({ filePath: path.join(directory, filepath), extractedTitle: title });
            else
                parsedData.failed.push(path.join(directory, filepath));
        }
        return parsedData;
    }

    execute(config: UserConfiguration) {
        return new Promise<ParsedData>((resolve, reject) => {
            if (this.validate(config.parserInputs['glob-regex']) === null) {
                let titleData = this.extractTitleTag(config.parserInputs['glob-regex']);
                glob(titleData.finalGlob, { silent: true, dot: true, cwd: config.romDirectory }, (err, files) => {
                    if (err)
                        reject(err);
                    else
                        resolve(this.extractTitles(titleData, config.romDirectory, files));
                });
            }
            else
                throw new Error('invalid "glob-regex" input!');
        });
    }
}