import { MarkdownIt } from 'markdown-it';
import { gApp } from "../app.global";
import * as _ from 'lodash';

export function MarkdownVariable(md: MarkdownIt, options?: any) {
    md.inline.ruler.push("markdown-variable", (state: any, silent?: boolean): boolean => {
        let startPos = state.pos;
        if (state.src.charAt(startPos++) !== "#" || state.src.charAt(startPos++) !== "{") {
            return false;
        }

        let markup = state.src.slice(state.pos, startPos);
        let endPos = state.src.indexOf("}", startPos);

        if (endPos !== -1) {
            let content = state.src.slice(state.pos, ++endPos);
            if (!content.match(/\r\n|\r|\n/g)) {
                let match = /(svg|gVar|DOM)\s*\[(.+)\]/.exec(content);
                if (!silent && match !== null && match[1] != null && match[2] != null) {
                    let token = state.push("markdown-variable", match[1], 0);
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
    });
    
    md.renderer.rules["markdown-variable"] = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        switch (token.tag) {
            case 'svg':
                return `<svg ${md.utils.escapeHtml(tokens[idx].content)}></svg>`;
            case 'gVar':
                return `${_.get(gApp, md.utils.escapeHtml(tokens[idx].content), 'undefined')}`;
            case 'DOM':
                return tokens[idx].content;
            default:
                return '';
        }
    };
}