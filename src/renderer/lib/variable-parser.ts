import { delimeterPairs } from "../models";

export class VariableParser {
    private pairs: delimeterPairs[] = null;

    constructor(private leftDelimeter: string, private rightDelimeter: string, private input?: string) {
        if (input !== undefined){
            this.parse();
        }
    }

    private isExactMatch(input1: string, it1: number, input2: string) {
        for (let j = 0; j < input2.length; j++) {
            if (input2[j] !== input1[j + it1]) {
                return false;
            }
        }
        return true;
    };

    setInput(input: string){
        this.input = input;
        this.pairs = null;
    }

    isValid(){
        return this.pairs !== null;
    }

    parse() {
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
                    if (this.input.length >= this.leftDelimeter.length + i && this.isExactMatch(this.input, i, this.leftDelimeter)) {
                        if (level++ === 0) {
                            this.pairs.push({ left: { start: i, end: i + this.leftDelimeter.length }, right: undefined });
                        }
                        i += this.leftDelimeter.length - 1;
                    }
                    else if (this.input.length >= this.rightDelimeter.length + i && this.isExactMatch(this.input, i, this.rightDelimeter)) {
                        if (level > 0) {
                            if (--level === 0) {
                                this.pairs[this.pairs.length - 1].right = { start: i, end: i + this.rightDelimeter.length };
                            }
                        }
                        else {
                            this.pairs = null;
                            return false;
                        }
                        i += this.rightDelimeter.length - 1;
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

    unescapeDelimeters(input: string[]) {
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
                        if (input[i].length >= this.leftDelimeter.length + j && this.isExactMatch(input[i], j, this.leftDelimeter)) {
                            output[i] += this.leftDelimeter;
                            j += this.leftDelimeter.length - 1;
                        }
                        else if (input[i].length >= this.rightDelimeter.length + j && this.isExactMatch(input[i], j, this.rightDelimeter)) {
                            output[i] += this.rightDelimeter;
                            j += this.rightDelimeter.length - 1;
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
            return unescaped ? this.unescapeDelimeters(variables) : variables;
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
            return unescaped ? this.unescapeDelimeters(variables) : variables;
        }
        else
            return null;
    }

    replaceVariables(replacement: string[]) {
        if (this.pairs !== null || this.pairs.length !== replacement.length) {
            let stringSegments: string[] = [];
            if (this.pairs.length > 0) {
                stringSegments.push(this.input.substring(0, this.pairs[0].left.start), replacement[0]);
            }
            for (let i = 1; i < this.pairs.length; i++) {
                stringSegments.push(this.input.substring(this.pairs[i - 1].right.end, this.pairs[i].left.start), replacement[i]);
            }
            if (this.pairs.length > 0) {
                stringSegments.push(this.input.substring(this.pairs[this.pairs.length - 1].right.end));
            }
            return stringSegments.join('');
        }
        else
            return null;
    }
}