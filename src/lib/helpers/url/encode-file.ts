export function encodeFile(value: string) {
    return encodeURI(`file:///${value.replace(/\\/g, '/')}`).replace(/#/g, '%23');
}
