import { delimiterPairs } from "../models";

export class VariableParser {
    private pairs: delimiterPairs[] = null;
    private input: string;

    constructor(private leftDelimiter: string, private rightDelimiter: string) { }

    private static isExactMatch(input1: string, it1: number, input2: string) {
        for (let i = 0; i < input2.length; i++) {
            if (input2[i] !== input1[i + it1]) {
                return false;
            }
        }
        return true;
    };

    /**
     * @return Returns `false` if string is invalid, `null` if string has no variables or `true` if variables were found.
     */
    static containsVariables(leftDelimiter: string, rightDelimiter: string, input: string, unescapedOnly: boolean = true) {
        let isEscaped = false;
        let output = null;
        let level = 0;

        for (let i = 0; i < input.length; i++) {
            if (input[i] === '\\') {
                isEscaped = !isEscaped;
            } else {
                if (!isEscaped) {
                    if (input.length >= leftDelimiter.length + i && VariableParser.isExactMatch(input, i, leftDelimiter)) {
                        level++;
                        i += leftDelimiter.length - 1;
                    }
                    else if (input.length >= rightDelimiter.length + i && VariableParser.isExactMatch(input, i, rightDelimiter)) {
                        if (level > 0) {
                            if (--level === 0) {
                                output = true;
                            }
                        }
                        else {
                            output = false;
                            break;
                        }
                        i += rightDelimiter.length - 1;
                    }
                }
                isEscaped = false;
            }
        }

        return output;
    }

    /**
     * @return Returns `false` if string is invalid, `null` if string has no variables or `true` if variables were found.
     */
    containsVariables(input: string, unescapedOnly: boolean = true) {
        return VariableParser.containsVariables(this.leftDelimiter, this.rightDelimiter, input, unescapedOnly);
    }

    setInput(input: string) {
        this.input = input;
        this.pairs = null;
        return this;
    }

    isValid() {
        return this.pairs !== null;
    }

    parse(depthLevel: number = 0) {
        let isEscaped = false;
        let level = 0;

        if (this.input !== undefined && this.input.length > 0)
            this.pairs = [];
        else {
            this.pairs = null;
            return false;
        }

        for (let i = 0; i < this.input.length; i++) {
            if (this.input[i] === '\\') {
                isEscaped = !isEscaped;
            } else {
                if (!isEscaped) {
                    if (this.input.length >= this.leftDelimiter.length + i && VariableParser.isExactMatch(this.input, i, this.leftDelimiter)) {
                        if (level++ === depthLevel) {
                            this.pairs.push({ left: { start: i, end: i + this.leftDelimiter.length }, right: undefined });
                        }
                        i += this.leftDelimiter.length - 1;
                    }
                    else if (this.input.length >= this.rightDelimiter.length + i && VariableParser.isExactMatch(this.input, i, this.rightDelimiter)) {
                        if (level > 0) {
                            if (--level === depthLevel) {
                                this.pairs[this.pairs.length - 1].right = { start: i, end: i + this.rightDelimiter.length };
                            }
                        }
                        else {
                            this.pairs = null;
                            return false;
                        }
                        i += this.rightDelimiter.length - 1;
                    }
                }
                isEscaped = false;
            }
        }

        if (level !== 0) {
            this.pairs = null;
            return false;
        }
        else
            return true;
    }

    unescapeDelimiters(input: string[]) {
        let isEscaped = false;
        let output: string[] = [];

        for (let i = 0; i < input.length; i++) {
            output.push('');
            for (let j = 0; j < input[i].length; j++) {
                if (input[i][j] === '\\') {
                    if (isEscaped) {
                        output[i] += '\\\\';
                    }
                    isEscaped = !isEscaped;
                } else {
                    if (isEscaped) {
                        if (input[i].length >= this.leftDelimiter.length + j && VariableParser.isExactMatch(input[i], j, this.leftDelimiter)) {
                            output[i] += this.leftDelimiter;
                            j += this.leftDelimiter.length - 1;
                        }
                        else if (input[i].length >= this.rightDelimiter.length + j && VariableParser.isExactMatch(input[i], j, this.rightDelimiter)) {
                            output[i] += this.rightDelimiter;
                            j += this.rightDelimiter.length - 1;
                        }
                        else {
                            output[i] += '\\';
                            output[i] += input[i][j];
                        }
                    }
                    else
                        output[i] += input[i][j];
                    isEscaped = false;
                }
            }
        }

        return output;
    }

    getVariables(unescaped: boolean) {
        if (this.pairs !== null) {
            let variables: string[] = [];
            for (let i = 0; i < this.pairs.length; i++) {
                variables.push(this.input.substring(this.pairs[i].left.start, this.pairs[i].right.end));
            }
            return unescaped ? this.unescapeDelimiters(variables) : variables;
        }
        else
            return [];
    }

    getContents(unescaped: boolean) {
        if (this.pairs !== null) {
            let variables: string[] = [];
            for (let i = 0; i < this.pairs.length; i++) {
                variables.push(this.input.substring(this.pairs[i].left.end, this.pairs[i].right.start));
            }
            return unescaped ? this.unescapeDelimiters(variables) : variables;
        }
        else
            return null;
    }

    replaceVariables(replacement: string[]) {
        if (this.pairs !== null || this.pairs.length !== replacement.length) {
            if (this.pairs.length > 0) {
                let stringSegments: string[] = [];
                stringSegments.push(this.input.substring(0, this.pairs[0].left.start), replacement[0]);
                for (let i = 1; i < this.pairs.length; i++) {
                    stringSegments.push(this.input.substring(this.pairs[i - 1].right.end, this.pairs[i].left.start), replacement[i]);
                }
                stringSegments.push(this.input.substring(this.pairs[this.pairs.length - 1].right.end));
                return stringSegments.join('');
            }
            else
                return this.input;
        }
        else
            return null;
    }
}