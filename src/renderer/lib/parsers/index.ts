import * as GenericParsers from './all-parsers';
import { GenericParser } from '../../models/parser.model';

export const parsers = (() => {
    let parserObject: { [title: string]: GenericParser } = {};

    for (let key in GenericParsers) {
        let parser = (GenericParsers[key].prototype as GenericParser);
        parserObject[parser.getParserInfo().title] = parser;
    }

    return parserObject;
})();

export function availableParsers() {
    return Object.keys(parsers);
};

export function availableParserInputs() {
    let inputs: string[] = [];

    for (let title in parsers) {
        inputs = inputs.concat(Object.keys(parsers[title].getParserInfo().inputs));
    }

    return inputs;
};