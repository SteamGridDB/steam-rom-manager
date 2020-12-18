export function caseInsensitiveTraverse(o: any, kseq: string[]): any {
  if(kseq.length==0){ return o; }
  let validKeys = Object.keys(o).filter(k=>k.toLowerCase()==kseq[0].toLowerCase());
  if(validKeys.length==0) { throw `Incorrect Key: ${kseq[0]}` }
  return caseInsensitiveTraverse(o[validKeys[0]], kseq.slice(1))
}
