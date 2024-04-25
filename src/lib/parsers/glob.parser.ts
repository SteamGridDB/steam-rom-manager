import { ParserInfo, GenericParser, UserConfiguration, ParsedData } from '../../models';
import { APP } from '../../variables';
import { glob } from 'glob';
import * as path from 'path';
import * as _ from "lodash";
import * as minimatch from 'minimatch';

interface TitleTagData {
  depth: {
    direction: 'left' | 'right',
    level: number
  },
  finalGlob: string,
  titleRegex: {
    regex: RegExp,
    pos: number
  }
}

export class GlobParser implements GenericParser {
  getParserInfo(): ParserInfo {
    return {
      title: 'Glob',
      info: this.lang.docs__md.self.join(''),
      inputs: {
        'glob': {
          label: this.lang.inputTitle,
          placeholder: this.lang.inputPlaceholder,
          required: true,
          inputType: 'text',
          validationFn: this.validate.bind(this),
          info: this.lang.docs__md.input.join('')
        }
      }
    };
  }

  private get lang() {
    return APP.lang.globParser;
  }

  private validate(fileGlob: string) {
    let testRegExpr = /(\${title})/gi;
    let match = testRegExpr.exec(fileGlob);
    if (match === null)
      return this.lang.errors.noTitle__md;
    else if (match.length > 3)
      return this.lang.errors.moreThanOneTitle__md;

    testRegExpr = /.*\*\${title}.*|.*\${title}\*.*/i;
match = testRegExpr.exec(fileGlob);
if (match !== null)
  return this.lang.errors.noStarNextToTitle__md;

testRegExpr = /.*\?\${title}.*|.*\${title}\?.*/i;
match = testRegExpr.exec(fileGlob);
if (match !== null)
  return this.lang.errors.noAnyCharNextToTitle__md;

testRegExpr = /.*\*\*.+\${title}.+\*\*.*/i;
match = testRegExpr.exec(fileGlob);
if (match !== null)
  return this.lang.errors.noGlobstarOnBothSides__md;

testRegExpr = /.*\{.*?\/+.*?\}.*\${title}.*\{.*?\/+.*?\}.*/i;
match = testRegExpr.exec(fileGlob);
if (match !== null)
  return this.lang.errors.noBracedDirSetOnBothSides__md;

testRegExpr = /.*\{.*?\/+.*?\}.*\${title}.+\*\*.*|.*\*\*.+\${title}.*\{.*?\/+.*?\}.*/i;
match = testRegExpr.exec(fileGlob);
if (match !== null)
  return this.lang.errors.noBracedDirSetOrGlobstarOnBothSides__md;

testRegExpr = /(\?|!|\+|\*|@)\((.*?)\)/gi;
while ((match = testRegExpr.exec(fileGlob)) !== null) {
  if (match[2].length === 0)
    return this.lang.errors.noEmptyPattern__md;
}

testRegExpr = /\[(.*?)\]/g;
while ((match = testRegExpr.exec(fileGlob)) !== null) {
  if (match[1].length === 0)
    return this.lang.errors.noEmptyCharRange__md;
}

testRegExpr = /.*(\?|!|\+|\*|@)\((.+?)\)\${title}(\?|!|\+|\*|@)\((.+?)\).*|.*(\?|!|\+|\*|@)\((.+?)\)\${title}.*|.*\${title}(\?|!|\+|\*|@)\((.+?)\).*/i;
match = testRegExpr.exec(fileGlob);
if (match !== null) {
  let patterns: string[];
  if (match[2] || match[6]) {
    patterns = (match[2] || match[6]).split('|');
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i][patterns[i].length - 1] === '*')
        return this.lang.errors.noStarInPatternNextToTitle__md;
      else if (patterns[i][patterns[i].length - 1] === '?')
        return this.lang.errors.noAnyCharInPatternNextToTitle__md;
    }
  }
  else if (match[4] || match[8]) {
    patterns = (match[4] || match[8]).split('|');
    for (let i = 0; i < patterns.length; i++) {
      if (patterns[i][0] === '*')
        return this.lang.errors.noStarInPatternNextToTitle__md;
      else if (patterns[i][0] === '?')
        return this.lang.errors.noAnyCharInPatternNextToTitle__md;
    }
  }
}

return null;
  }

  private getTitleDepth(fileGlob: string) {
    let depth: { direction: 'left' | 'right', level: number } = { direction: undefined, level: undefined };
    let tempGlob = undefined;
    if (fileGlob.replace(/\${title}/i, '').length === 0) {
      depth.level = null;
    }
    else if (/.*(?:\*\*|\{.*?\/+.*?\}).+\${title}.*/i.test(fileGlob)) {
depth.direction = 'right';
tempGlob = fileGlob.replace(/.*\${title}/i, '');
    }
    else {
      depth.direction = 'left';
      tempGlob = fileGlob.replace(/\${title}.*/i, '');
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
    let getRegexString = (segment: string) => {
      let mm = new minimatch.Minimatch(segment, { dot: true });
      if (mm.empty)
        return '^\\s*?$';
      else{
        return (mm.makeRe()||{}).source;
      }
    }

    let titleSegmentMatch = fileGlob.match(/.*\/(.*\${title}.*?)\/|.*\/(.*\${title}.*)|(.*\${title}.*?)\/|(.*\${title}.*)/i);
    if (titleSegmentMatch !== null) {
      let titleSegments = (titleSegmentMatch[1] || titleSegmentMatch[2] || titleSegmentMatch[3] || titleSegmentMatch[4]).split(/\${title}/i);
      if (titleSegments[0].length > 0) {
        let regexString = getRegexString(titleSegments[0]);
        titleRegex += regexString.substr(0, regexString.length - 1);
        pos++;
      }
      else
        titleRegex += '^';

      titleRegex += '(.*?)';

      if (titleSegments[1].length > 0) {
        let regexString = getRegexString(titleSegments[1]);
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
      return '*';
  }

  private extractTitleTag(fileGlob: string) {
    let extractedData: TitleTagData = { finalGlob: undefined, titleRegex: undefined, depth: undefined };
    extractedData.depth = this.getTitleDepth(fileGlob);
    extractedData.titleRegex = this.getTitleRegex(fileGlob);
    extractedData.finalGlob = this.getFinalGlob(fileGlob, extractedData.depth.level);
    return extractedData;
  }

  private extractTitle(titleData: TitleTagData, file: string) {
    if (titleData.depth.level !== null) {
      let fileSections = file.split('/');
      file = fileSections[titleData.depth.direction === 'right' ? fileSections.length - (titleData.depth.level + 1) : titleData.depth.level];
    }
    if (file !== undefined) {
      let titleMatch = file.match(titleData.titleRegex.regex);
      if (titleMatch !== null && titleMatch[titleData.titleRegex.pos])
        return titleMatch[titleData.titleRegex.pos].replace(/\//g, path.sep).trim();
    }
    return undefined;
  }

  private extractTitles(titleData: TitleTagData, directory: string, files: string[]) {
    let parsedData: ParsedData = { success: [], failed: [] };
    for (let i = 0; i < files.length; i++) {
      let title = this.extractTitle(titleData, files[i].replace(/\\/g,'/'));
      let filePath = files[i].replace(/\\|\//g, path.sep);
      filePath = path.isAbsolute(filePath) ? filePath : path.join(directory, filePath);
      if (title !== undefined)
        parsedData.success.push({ filePath, extractedTitle: title });
      else
        parsedData.failed.push(filePath);
    }
    return parsedData;
  }

  execute(directories: string[], inputs: { [key: string]: any }) {
    const directory: string = directories[0];
    return new Promise<ParsedData>((resolve,reject)=> {
      const validationText = this.validate(inputs['glob']);
      if (validationText === null) {
        const titleData = this.extractTitleTag(inputs['glob']);
        glob(titleData.finalGlob, { dot: true, cwd: directory, follow: true }).then((files: string[]) => {
          const drive = /^[a-zA-z]\:\\$/g;
          const driveReplace = /^[a-zA-z]\:\\/g
          resolve(this.extractTitles(titleData, directory as string, 
            drive.test(directory) ? files.map(x=>x.replace(driveReplace,'')) : files
            ));
        }).catch((err: string) => {
          reject(err);
        })
      }
      else
        throw new Error(validationText);
    });
  }
}
