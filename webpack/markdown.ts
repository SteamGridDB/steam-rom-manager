import { LoaderDefinitionFunction } from "webpack";

/**
 * The `splice()` method changes the contents of a string
 * by removing or replacing existing elements and/or adding
 * new elements in place.
 *
 * See Array version here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
 */
const spliceString = (
  input: string,
  start: number,
  deleteCount: number = 0,
  ...items: string[]
): string => {
  return (
    input.slice(0, start) + items.join("") + input.slice(start + deleteCount)
  );
};

/**
 * matches strings like `[text](../some/relative/resource)`
 */
const re = /(\[.*?\](?::\s+|\()(?:(?!http|#)))(.+?)(?:\s.*?(?=\))|)(?:\)|\s)/g;

/**
 * add in markdown referenced resources (pictures) to the webpack dependency tree
 */
const extractResourcesInMarkdown: LoaderDefinitionFunction = async function (
  source,
) {
  let newSource = source;
  const resolve = this.getResolve();
  const matches = source.matchAll(re);
  // if we wouldn't iterate in reverse order than the index of the 2nd+ match
  // wouldn't match after we mutate the string
  for (const match of Array.from(matches).reverse()) {
    const { index, 1: preString, 2: originalPath } = match;
    const newPath = await this.importModule(
      await resolve(this.context, originalPath),
    );
    // TS suggests that `newPath` is `any` so make sure we get a string
    if (typeof newPath !== "string") {
      throw new Error("Expected `importModule` to return a string");
    }
    newSource = spliceString(
      newSource,
      index + preString.length,
      originalPath.length,
      newPath,
    );
  }

  return newSource;
};

module.exports = extractResourcesInMarkdown;
