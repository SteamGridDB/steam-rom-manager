import { Parser, GenericParser, UserConfiguration, ParsedData } from '../../models';
import * as glob from 'glob';
import * as path from 'path';
import { escapeRegExp } from "lodash";

interface TitleTagData {
    direction: 'left' | 'right',
    level: number,
    finalGlob: string,
    leftovers: { left: string, right: string }
}

export class GlobParser implements GenericParser {
    getParser(): Parser {
        return {
            title: 'Glob',
            info: `
                <div class="paragraph">
                    Extracts title from a path. Directories/files are matched using <span class="code">glob</span> pattern (uses node-glob). 
                    Parser tries to extract title from a path segment (which are separated by path separators) containing 
                    <span class="code">\${title}</span> and using other "leftover" characters as a reference. For example, consider that we have:
                    <ul>
                        <li><span class="code">glob</span>: <span class="code">**/\${title}&nbsp;[/*/*.fml</span></li>
                        <li><span class="code">filePath</span>: <span class="code">Dir1\\Dir2\\Roses are red [or green]\\Dir3\\myfile.fml</span></li>
                    </ul>
                    It will match <span class="code">\${title}</span> with <span class="code">Roses are red [or green]</span>. Then it will use "leftovers"
                    <span class="code">&nbsp;[</span> to determinate that title should be before <span class="code">&nbsp;[</span>. Thus, it will extract 
                    <span class="code">Roses are red</span> to use as a title. Furthermore, extracted title has whitespaces trimmed off.
                </div>
                <div class="paragraph">
                    This parser should be used only when title containing path segment has one pattern (see "User\'s glob" below for examples).
                </div>
            `,
            inputs: {
                'glob': {
                    label: 'User\'s glob',
                    validationFn: this.validate.bind(this),
                    info: `
                        <div class="paragraph">
                            Glob containing <span class="code">\${title}</span> which is later replaced with a star <span class="code">*</span> or globstar <span class="code">**</span> 
                            if there are no path separators. Below are few examples of how parser extracts title from <span class="code">C:\\ROMS\\Roses are red [AEF123] 7\\myfile.fml</span>:
                        </div>
                        <div class="paragraph">
                            <span class="code">\${title}</span>
                            <ul>
                                <li>Roses are red [AEF123] 7</li>
                                <li>Roses are red [AEF123] 7\\myfile.fml</li>
                            </ul>
                            <span class="code">\${title}&nbsp;</span>
                            <ul>
                                <li>Roses are red [AEF123]</li>
                            </ul>
                            <span class="code">\${title} [</span>
                            <ul>
                                <li>Roses are red</li>
                            </ul>
                            <span class="code">\${title}red</span>
                            <ul>
                                <li>Roses are</li>
                            </ul>
                            <span class="code">\${title} /*.fml</span>
                            <ul>
                                <li>Roses are red [AEF123]</li>
                            </ul>
                            <span class="code">\${title} [/*.fml</span>
                            <ul>
                                <li>Roses are red</li>
                            </ul>                            
                        </div>
                    `
                }
            }
        };
    }

    private validate(fileGlob: string) {
        let testRegExpr = /(\${title})/gi;
        let match = testRegExpr.exec(fileGlob);
        if (match === null)
            return 'File glob must contain ${title}!';
        else if (match.length > 3)
            return 'File glob must contain only one ${title}!';

        testRegExpr = /.*\*\${title}.*|.*\${title}\*.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return 'Star (*) can not be next to ${title}!';

        testRegExpr = /\\/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return 'Windows directory character (\\) is not alowed! Use "/" instead.';

        testRegExpr = /.*\*\*.+\${title}.+\*\*.*/i;
        match = testRegExpr.exec(fileGlob);
        if (match !== null)
            return 'Globstar (**) can only be on one side of ${title}!';

        return null;
    }

    private getTitleDepth(fileGlob: string) {
        let depth: { direction: 'left' | 'right', level: number } = { direction: undefined, level: undefined };
        let tempGlob = undefined;
        if (fileGlob.replace(/\${title}/i, '').length === 0) {
            depth.level = null;
        }
        else if (/.*\*\*.+\${title}.*/i.test(fileGlob)) {
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

    private getTitleLeftovers(fileGlob: string) {
        let leftovers: { left: string, right: string } = { left: '', right: '' };
        let titleSegmentMatch = fileGlob.match(/.*\/(.*\${title}.*?)\/|.*\/(.*\${title}.*)|(.*\${title}.*?)\/|(.*\${title}.*)/i);
        if (titleSegmentMatch !== null) {
            let titleSegments = (titleSegmentMatch[1] || titleSegmentMatch[2] || titleSegmentMatch[3] || titleSegmentMatch[4]).split('*');
            for (var i = 0; i < titleSegments.length; i++) {
                if (titleSegments[i].search(/\${title}/i) !== -1) {
                    let leftoverSegments = titleSegments[i].split(/\${title}/i);
                    leftovers.left = leftoverSegments[0] !== undefined ? leftoverSegments[0] : '';
                    leftovers.right = leftoverSegments[1] !== undefined ? leftoverSegments[1] : '';
                }
            }
        }
        return leftovers;
    }

    private getFinalGlob(fileGlob: string, depth: { direction: 'left' | 'right', level: number }) {
        if (depth.level !== null) {
            let fileSections = fileGlob.replace(/(\${.+})/i, '').split('/');
            fileSections[depth.direction === 'right' ? fileSections.length - (depth.level + 1) : depth.level] = '*';
            return fileSections.join('/');
        }
        else
            return '**';
    }

    private extractTitleTag(fileGlob: string) {
        let extractedData: TitleTagData = { direction: undefined, level: undefined, finalGlob: undefined, leftovers: { left: undefined, right: undefined } };
        let depth = this.getTitleDepth(fileGlob);
        let leftovers = this.getTitleLeftovers(fileGlob);
        extractedData.direction = depth.direction;
        extractedData.level = depth.level;
        extractedData.leftovers.left = leftovers.left ? '.*' + escapeRegExp(leftovers.left) : '';
        extractedData.leftovers.right = leftovers.right ? escapeRegExp(leftovers.right) + '.*' : '';
        extractedData.finalGlob = this.getFinalGlob(fileGlob, depth);
        return extractedData;
    }

    private extractTitle(titleData: TitleTagData, file: string) {
        if (titleData.level !== null) {
            let fileSections = file.split('/');
            file = fileSections[titleData.direction === 'right' ? fileSections.length - (titleData.level + 1) : titleData.level];
        }
        let titleRegExp = new RegExp(titleData.leftovers.left + '(.+)' + titleData.leftovers.right);
        let titleMatch = file.match(titleRegExp);
        if (titleMatch !== null)
            return titleMatch[1].replace(/\//g, path.sep).trim();
        else
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
            if (this.validate(config.parserInputs['glob']) === null) {
                let titleData = this.extractTitleTag(config.parserInputs['glob']);
                glob(titleData.finalGlob, { silent: true, dot: true, cwd: config.romDirectory }, (err, files) => {
                    if (err)
                        reject(err);
                    else
                        resolve(this.extractTitles(titleData, config.romDirectory, files));
                });
            }
            else
                reject('Invalid "glob" input!');
        });
    }
}