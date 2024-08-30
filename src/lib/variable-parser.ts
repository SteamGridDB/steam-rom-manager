import {
  VariableParserItem,
  VariableParserAST,
  VariableParserBreadthFirstData,
  VariableParserPostOrderData,
} from "../models";

export class VariableParser {
  private static isDelimiter(
    input: string,
    inputOffset: number,
    delimiter: string,
  ) {
    for (let i = 0; i < delimiter.length; i++) {
      if (delimiter[i] !== input[i + inputOffset]) {
        return false;
      }
    }
    return true;
  }

  static isValidString(
    leftDelimiter: string,
    rightDelimiter: string,
    input: string,
  ) {
    let isEscaped = false;
    let valid = true;
    let level = 0;
    let i = 0;
    let leftLengthDiff = input.length - leftDelimiter.length;
    let rightLengthDiff = input.length - rightDelimiter.length;

    while (i < input.length) {
      if (input[i] === "\\") {
        isEscaped = !isEscaped;
        i++;
      } else {
        if (!isEscaped) {
          if (
            leftLengthDiff >= i &&
            VariableParser.isDelimiter(input, i, leftDelimiter)
          ) {
            level++;
            i += leftDelimiter.length;
          } else if (
            rightLengthDiff >= i &&
            VariableParser.isDelimiter(input, i, rightDelimiter)
          ) {
            if (level > 0) level--;
            else {
              valid = false;
              break;
            }
            i += rightDelimiter.length;
          } else i++;
        } else {
          isEscaped = false;
          i++;
        }
      }
    }

    return valid && level === 0;
  }

  static buildAST(
    leftDelimiter: string,
    rightDelimiter: string,
    input: string,
  ) {
    let isEscaped = false;
    let level = 0;
    let lastStringIndex = 0;
    let i = 0;
    let leftLengthDiff = input.length - leftDelimiter.length;
    let rightLengthDiff = input.length - rightDelimiter.length;
    let ast: VariableParserAST = {
      leftDelimiter,
      rightDelimiter,
      input,
      maxLevel: 0,
      parsedTree: [],
    };
    let currentParent: VariableParserItem = undefined;
    let getCurrentTree = () => {
      return currentParent !== undefined
        ? currentParent.children
        : ast.parsedTree;
    };
    let pushString = (parentTree: VariableParserItem[]) => {
      if (lastStringIndex < i) {
        parentTree.push({
          type: "string",
          range: { start: lastStringIndex, end: i },
          children: [],
          parent: currentParent,
        });
      }
    };

    while (i < input.length) {
      if (input[i] === "\\") {
        isEscaped = !isEscaped;
        i++;
      } else {
        if (!isEscaped) {
          if (
            leftLengthDiff >= i &&
            VariableParser.isDelimiter(input, i, leftDelimiter)
          ) {
            let parentTree = getCurrentTree();

            pushString(parentTree);

            parentTree.push({
              type: "variable",
              range: { start: i, end: null },
              children: [],
              parent: currentParent,
            });

            currentParent = parentTree[parentTree.length - 1];

            i += leftDelimiter.length;
            lastStringIndex = i;
            if (ast.maxLevel < level) ast.maxLevel++;
            level++;
          } else if (
            rightLengthDiff >= i &&
            VariableParser.isDelimiter(input, i, rightDelimiter)
          ) {
            if (level > 0) {
              pushString(currentParent.children);

              level--;
              i += rightDelimiter.length;
              lastStringIndex = i;

              currentParent.range.end = i;
              currentParent = currentParent.parent;
            } else break;
          } else i++;
        } else {
          isEscaped = false;
          i++;
        }
      }
    }

    pushString(getCurrentTree());

    return ast;
  }

  static stringifyAST(
    ast: VariableParserAST,
    space?: string | number,
    includeSegments: boolean = false,
  ) {
    return JSON.stringify(
      ast,
      (key, value) => {
        if (key === "parent") {
          return undefined;
        } else if (value && value["type"] !== undefined && includeSegments) {
          return Object.assign(
            {
              segment: ast.input.substring(
                value["range"]["start"],
                value["range"]["end"],
              ),
            },
            value,
          );
        }
        return value;
      },
      space,
    );
  }

  static traverseAST(
    ast: VariableParserAST,
    callback: (
      ast: VariableParserAST,
      item: VariableParserItem,
      level: number,
      passedData: any,
      abort: () => void,
    ) => any | void,
    fromRoot: boolean,
  ) {
    let abortTraversal: boolean = false;
    let abortCallback = () => (abortTraversal = true);

    if (fromRoot) {
      let current: VariableParserBreadthFirstData = {
        level: 0,
        next: null,
        children: ast.parsedTree,
        passedData: undefined,
      };
      let previous: VariableParserBreadthFirstData = null;
      let children: VariableParserItem[] = undefined;
      let level: number = undefined;

      while (current && !abortTraversal) {
        level = current.level;
        children = current.children;
        previous = current;
        current = current.next;

        for (let i = 0; i < children.length; i++) {
          let child: VariableParserBreadthFirstData = {
            level: level + 1,
            next: current,
            children: children[i].children,
            passedData:
              callback(
                ast,
                children[i],
                level,
                previous.passedData,
                abortCallback,
              ) || null,
          };

          if (abortTraversal) break;

          current = child;
        }
      }
    } else {
      let current: VariableParserPostOrderData = {
        level: 0,
        index: 0,
        indexInParent: 0,
        previous: null,
        children: ast.parsedTree,
        passedData: new Array(ast.parsedTree.length).fill(undefined),
      };

      do {
        if (current.index < current.children.length) {
          let child: VariableParserPostOrderData = {
            level: current.level + 1,
            index: 0,
            indexInParent: current.index,
            previous: current,
            children: current.children[current.index].children,
            passedData: new Array(
              current.children[current.index].children.length,
            ).fill(undefined),
          };

          current.index++;
          if (child.index < child.children.length) current = child;
        } else {
          if (current.previous !== null) {
            if (
              current.previous.passedData[current.indexInParent] === undefined
            )
              current.previous.passedData[current.indexInParent] = [];

            for (
              let i = 0;
              i < current.children.length && !abortTraversal;
              i++
            ) {
              current.previous.passedData[current.indexInParent].push(
                callback(
                  ast,
                  current.children[i],
                  current.level,
                  current.passedData[i],
                  abortCallback,
                ) || null,
              );
            }
          } else {
            for (
              let i = 0;
              i < current.children.length && !abortTraversal;
              i++
            ) {
              callback(
                ast,
                current.children[i],
                current.level,
                current.passedData[i],
                abortCallback,
              );
            }
          }

          current = current.previous;
        }
      } while (current !== null && !abortTraversal);
    }
  }

  static unescape(
    leftDelimiter: string,
    rightDelimiter: string,
    input: string,
  ) {
    let output: string = "";

    let i = 0;
    let leftLengthDiff = input.length - leftDelimiter.length;
    let rightLengthDiff = input.length - rightDelimiter.length;

    while (i < input.length) {
      if (input[i] === "\\") {
        if (
          leftLengthDiff >= i + 1 &&
          VariableParser.isDelimiter(input, i + 1, leftDelimiter)
        ) {
          output += leftDelimiter;
          i += leftDelimiter.length + 1;
          continue;
        } else if (
          rightLengthDiff >= i + 1 &&
          VariableParser.isDelimiter(input, i + 1, rightDelimiter)
        ) {
          output += rightDelimiter;
          i += rightDelimiter.length + 1;
          continue;
        }
      }
      output += input[i++];
    }

    return output;
  }

  static replaceVariables(
    ast: VariableParserAST,
    replacer: (variable: string, level: number) => string,
  ) {
    let output: string = "";

    VariableParser.traverseAST(
      ast,
      (ast, item, level, passedData: string[]) => {
        if (level === 0) {
          if (item.type === "string") {
            let dataString = ast.input.substring(
              item.range.start,
              item.range.end,
            );
            if (
              item.range.end !== ast.input.length &&
              dataString[dataString.length - 1] === "\\"
            )
              dataString = dataString.slice(0, -1);
            output += VariableParser.unescape(
              ast.leftDelimiter,
              ast.rightDelimiter,
              dataString,
            );
          } else {
            output += replacer(passedData ? passedData.join("") : "", level);
          }
        } else {
          if (item.type === "string") {
            let dataString = ast.input.substring(
              item.range.start,
              item.range.end,
            );
            if (dataString[dataString.length - 1] === "\\")
              dataString = dataString.slice(0, -1);
            return VariableParser.unescape(
              ast.leftDelimiter,
              ast.rightDelimiter,
              dataString,
            );
          } else {
            return replacer(passedData ? passedData.join("") : "", level);
          }
        }
      },
      false,
    );

    return output;
  }

  static removeVariables(ast: VariableParserAST) {
    let output: string = "";

    VariableParser.traverseAST(
      ast,
      (ast, item, level, data, abort) => {
        if (level === 0) {
          if (item.type === "string") {
            let dataString = ast.input.substring(
              item.range.start,
              item.range.end,
            );
            if (
              item.range.end !== ast.input.length &&
              dataString[dataString.length - 1] === "\\"
            )
              dataString = dataString.slice(0, -1);
            output += VariableParser.unescape(
              ast.leftDelimiter,
              ast.rightDelimiter,
              dataString,
            );
          }
        } else {
          abort();
        }
      },
      true,
    );

    return output;
  }

  static extractVariables(
    ast: VariableParserAST,
    replacer: (variable: string, level: number) => string,
    baseLevel: number = 0,
  ) {
    let variables: string[] = [];

    VariableParser.traverseAST(
      ast,
      (ast, item, level, passedData: string[], abort) => {
        if (level === baseLevel) {
          if (item.type === "variable") {
            variables.push(passedData ? passedData.join("") : "");
          }
        } else if (level > baseLevel) {
          if (item.type === "string") {
            let dataString = ast.input.substring(
              item.range.start,
              item.range.end,
            );
            if (dataString[dataString.length - 1] === "\\")
              dataString = dataString.slice(0, -1);
            return VariableParser.unescape(
              ast.leftDelimiter,
              ast.rightDelimiter,
              dataString,
            );
          } else {
            return replacer(passedData ? passedData.join("") : "", level);
          }
        } else abort();
      },
      false,
    );

    return variables;
  }

  private ast: VariableParserAST = undefined;
  private valid: boolean = false;

  constructor(
    private delimiters?: { left: string; right: string },
    private input?: string,
  ) {
    this.setDelimiters(delimiters).setInput(input);
  }

  setDelimiters(delimiters: { left: string; right: string }) {
    this.delimiters = delimiters;
    this.ast = undefined;
    this.valid = false;
    return this;
  }

  setInput(input: string) {
    this.input = input;
    this.ast = undefined;
    this.valid = false;
    return this;
  }

  isSet() {
    return this.delimiters != undefined && this.input != undefined;
  }

  isParsed() {
    return this.ast !== undefined;
  }

  isValid() {
    if (!this.valid && this.isSet())
      this.valid = VariableParser.isValidString(
        this.delimiters.left,
        this.delimiters.right,
        this.input,
      );

    return this.valid;
  }

  parse() {
    if (this.isValid())
      this.ast = VariableParser.buildAST(
        this.delimiters.left,
        this.delimiters.right,
        this.input,
      );

    return this.isParsed();
  }

  stringifyAST(space?: string | number, includeSegments: boolean = false) {
    return this.isParsed()
      ? VariableParser.stringifyAST(this.ast, space, includeSegments)
      : "";
  }

  traverseAST(
    callback: (
      ast: VariableParserAST,
      item: VariableParserItem,
      level: number,
      passedData: any,
      abort: () => void,
    ) => any | void,
    fromRoot: boolean,
  ) {
    if (this.isParsed())
      VariableParser.traverseAST(this.ast, callback, fromRoot);
  }

  unescape() {
    return this.isSet()
      ? VariableParser.unescape(
          this.delimiters.left,
          this.delimiters.right,
          this.input,
        )
      : "";
  }

  replaceVariables(replacer: (variable: string, level: number) => string) {
    return this.isParsed()
      ? VariableParser.replaceVariables(this.ast, replacer)
      : "";
  }

  removeVariables() {
    return this.isParsed() ? VariableParser.removeVariables(this.ast) : "";
  }

  extractVariables(
    replacer: (variable: string, level: number) => string,
    baseLevel: number = 0,
  ) {
    return this.isParsed()
      ? VariableParser.extractVariables(this.ast, replacer, baseLevel)
      : [];
  }
}
