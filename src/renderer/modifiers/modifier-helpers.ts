export const replaceVariables_undefined = (oldValue: any) =>
  typeof oldValue === "string"
    ? oldValue
        .replace(/\${dir}/gi, "${romDir}")
        .replace(/\${file}/gi, "${fileName}")
        .replace(/\${sep}/gi, "${/}")
    : "";
export const versionUp = (version: number) => {
  return version + 1;
};
export const extractNames = (str: string) => {
  let res: string[] = [];
  let current = '';
  let openCount = 0;
  let prevchar='';
  for (let char of str) {
    if (char == '}') {
      openCount--;
      if (openCount == 0) {
        res.push(current);
        current = '';
      }
    }
    if (openCount > 0) {
      current += char;
    }
    if (char == '{' && prevchar=="$") {
      openCount++;
    }
    prevchar=char;
  }
  return res;
};
