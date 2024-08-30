import MarkdownIt from "markdown-it";
import { APP } from "../variables";
import * as _ from "lodash";

export function MarkdownVariable(md: MarkdownIt, options?: any) {
  md.inline.ruler.push(
    "markdown-variable",
    (state: any, silent?: boolean): boolean => {
      let startPos = state.pos;
      if (
        state.src.charAt(startPos++) !== "#" ||
        state.src.charAt(startPos++) !== "{"
      ) {
        return false;
      }

      let markup = state.src.slice(state.pos, startPos);
      let endPos = state.src.indexOf("}", startPos);

      if (endPos !== -1) {
        let content = state.src.slice(state.pos, ++endPos);
        if (!content.match(/\r\n|\r|\n/g)) {
          let match = /(APP)\s*\[(.+)\]/.exec(content);
          if (
            !silent &&
            match !== null &&
            match[1] != null &&
            match[2] != null
          ) {
            let token: any = state.push("markdown-variable", match[1], 0);
            token.content = match[2];
            token.markup = markup;
          }
          state.pos = endPos;
          return true;
        }
      }

      if (!silent) {
        state.pending += markup;
      }
      state.pos = startPos;
      return true;
    },
  );

  md.renderer.rules["markdown-variable"] = (
    tokens,
    idx,
    options,
    env,
    self,
  ) => {
    const token = tokens[idx];
    switch (token.tag) {
      case "APP":
        return `${_.get(APP, md.utils.escapeHtml(tokens[idx].content), "undefined")}`;
      default:
        return "";
    }
  };
}
