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
