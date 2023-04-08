export function caselessGet(o: any, kseq: string[][], graceful?: boolean): any {
  if(kseq.length==0){ return o; }
  for(let i = 0; i < kseq[0].length; i++) {
    let validKeys = Object.keys(o).filter(k=>k.toLowerCase()==kseq[0][i].toLowerCase());
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
    let validKeys = Object.keys(o).filter(k=>k.toLowerCase() == kseq[0][i].toLowerCase());
    if(kseq.length == 1 || !validKeys.length) {
      return !!validKeys.length;
    } else {
      return caselessHas(o[validKeys[0]],kseq.slice(1))
    }
  }
  return false;
}
