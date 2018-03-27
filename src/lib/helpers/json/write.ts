import * as fs from 'fs-extra';

export function write(filename: string, value: any, replacer?: any) {
    return Promise.resolve().then(() => fs.outputJson(filename, value, { spaces: "\t", EOL: "\r\n", replacer } as any));
}
