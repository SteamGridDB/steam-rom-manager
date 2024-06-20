function getKeys(o: any, key: string): string[] {
  return Object.keys(o).filter(k => k.toLowerCase() == key.toLowerCase())
}

export function caselessSet(o: any, value: any, kseq: string[][]): any {
  if (kseq.length == 0) { return value }
  for (let i = 0; i < kseq[0].length; i++) {
    let validKeys = getKeys(o, kseq[0][i]);
    if (validKeys.length != 0) {
      o[validKeys[0]] = caselessSet(o[validKeys[0]], value, kseq.slice(1))
      return o;
    }
  }
  throw `Incorrect Key Possibilities: ${kseq[0]}`;
}

export function caselessGet(o: any, kseq: string[][], graceful?: boolean): any {
  if(kseq.length==0){ return o; }
  for(let i = 0; i < kseq[0].length; i++) {
    let validKeys = getKeys(o, kseq[0][i]);
    if(validKeys.length!=0) {
      return caselessGet(o[validKeys[0]], kseq.slice(1), graceful);
    }
  }
  if(graceful) {
    return "";
  } else {
    throw `Incorrect Key Possibilities: ${kseq[0]}`;
  }
}

export function caselessHas(o: any, kseq: string[][]): boolean {
  if(kseq.length==0){ return false }
  for(let i = 0; i < kseq[0].length; i++) {
    let validKeys = getKeys(o, kseq[0][i]);
    if(kseq.length == 1 || !validKeys.length) {
      return !!validKeys.length;
    } else {
      return caselessHas(o[validKeys[0]],kseq.slice(1))
    }
  }
  return false;
}

