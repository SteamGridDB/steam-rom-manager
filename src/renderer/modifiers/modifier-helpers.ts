export const replaceVariables_undefined = (oldValue: any) => typeof oldValue === 'string' ? oldValue.replace(/\${dir}/gi, '${romDir}').replace(/\${file}/gi, '${fileName}').replace(/\${sep}/gi, '${/}') : '';
export const versionUp = (version: number) => { return version + 1 };
export const extractNames = (str: string) => {
  const regex = /\$\{(.*?)\}/g; const names = []; let match;
  while ((match = regex.exec(str)) !== null) {
      names.push(match[1]);
  }
  return names;
}