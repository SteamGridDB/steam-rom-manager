import * as GenericParsers from "./all-parsers";
import { GenericParser, ParserType } from "../../models/parser.model";

export const parsers = (() => {
  let parserObject: Record<ParserType, GenericParser> = {} as Record<
    ParserType,
    GenericParser
  >;
  let key: keyof typeof GenericParsers;
  for (key in GenericParsers) {
    let parser = GenericParsers[key].prototype as GenericParser;
    parserObject[parser.getParserInfo().title] = parser;
  }

  return parserObject;
})();
