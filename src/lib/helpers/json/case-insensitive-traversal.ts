export function caseInsensitiveTraverse(o: any, kseq: string[][]): any {
  if(kseq.length==0){ return o; }
  for(let i = 0; i < kseq[0].length; i++) {
    let validKeys = Object.keys(o).filter(k=>k.toLowerCase()==kseq[0][i].toLowerCase());
    if(validKeys.length!=0) {
      return caseInsensitiveTraverse(o[validKeys[0]], kseq.slice(1));
    }
  }
  throw `Incorrect Key Possibilities: ${kseq[0]}`;
}
