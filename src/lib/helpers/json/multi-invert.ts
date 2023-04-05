import * as _ from "lodash";

export function multiInvert(a: {[k: string]: string | string[]}): {[k: string]: string | string[]} {
  let pairs = _.flattenDepth(Object.entries(a).map(x=>[].concat(x[1]).map(y=>[y,x[0]])),1);
  let res: {[k: string]: string | string[]} = {};
  for(let i=0; i < pairs.length; i++) {
    if(res[pairs[i][0]] === undefined) {
      res[pairs[i][0]]=pairs[i][1]
    } else {
      res[pairs[i][0]]=[].concat(res[pairs[i][0]]).concat(pairs[i][1])
    }
  }
  return res
}
