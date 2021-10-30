import * as path from 'path';
import { LoaderDefinition, LoaderDefinitionFunction } from 'webpack';

/**
 * matches strings like `[text](../some/relative/resource)`
 */
const re = /\[(.*?)\](:\s+|\()(?!http|#)(.+?)(?:(\s.*?)(?=\))|)(\)|\s)/g;



/**
 * add in markdown referenced resources (pictures) to the webpack dependency tree
 */
const extractResourcesInMarkdown: LoaderDefinitionFunction  = async function (source) {
  const resolve = this.getResolve()
  const matches = source.matchAll(re);
  for (const match of matches) {
    await this.importModule(await resolve(this.context, match[3]), {})
  }

  return source
};

module.exports = extractResourcesInMarkdown;
