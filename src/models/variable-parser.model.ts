export interface VariableParserItem {
  type: "string" | "variable";
  range: { start: number; end: number };
  children: VariableParserItem[];
  parent: VariableParserItem;
}

export interface VariableParserAST {
  leftDelimiter: string;
  rightDelimiter: string;
  input: string;
  maxLevel: number;
  parsedTree: VariableParserItem[];
}

export interface VariableParserBreadthFirstData {
  level: number;
  next: VariableParserBreadthFirstData;
  children: VariableParserItem[];
  passedData: any;
}

export interface VariableParserPostOrderData {
  level: number;
  index: number;
  indexInParent: number;
  previous: VariableParserPostOrderData;
  children: VariableParserItem[];
  passedData: any[];
}
