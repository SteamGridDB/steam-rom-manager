import * as _ from "lodash";

// export function multiInvert(a: {[k: string]: string | string[]}): {[k: string]: string | string[]} {
//   let pairs = _.flattenDepth(Object.entries(a).map(x=>[].concat(x[1]).map(y=>[y,x[0]])),1);
//   let res: {[k: string]: string | string[]} = {};
//   for(let i=0; i < pairs.length; i++) {
//     if(res[pairs[i][0]] === undefined) {
//       res[pairs[i][0]]=pairs[i][1]
//     } else {
//       res[pairs[i][0]]=[].concat(res[pairs[i][0]]).concat(pairs[i][1])
//     }
//   }
//   return res
// }

// export function multiInvert<K extends keyof any, V>(a: Record<K, V>): Record<V, K[]> {
//   let pairs = _.flattenDepth(Object.entries(a).map((x: [K, V])=>[].concat(x[1]).map(y=>[y,x[0]])),1);
//   let res: Record<V, K[]> = {};
//   for(let i=0; i < pairs.length; i++) {
//     if(res[pairs[i][0]] === undefined) {
//       res[pairs[i][0]]=pairs[i][1]
//     } else {
//       res[pairs[i][0]]=[].concat(res[pairs[i][0]]).concat(pairs[i][1])
//     }
//   }
//   return res;
// }

export function multiInvert<K extends keyof any, V extends keyof any>(
  record: Record<K, V[]>,
): Record<V, K> {
  const inverted: Record<V, K> = {} as Record<V, K>;
  for (const [key, values] of Object.entries(record)) {
    for (const value of values as V[]) {
      if (!inverted[value as V]) {
        inverted[value as V] = key as K;
      }
    }
  }
  return inverted;
}

export function multiMultiInvert<K extends keyof any, V extends keyof any>(
  record: Record<K, V[]>,
): Record<V, K[]> {
  const inverted: Record<V, K[]> = {} as Record<V, K[]>;
  for (const [key, values] of Object.entries(record)) {
    for (const value of values as V[]) {
      if (inverted[value as V]) {
        inverted[value as V].push(key as K);
      } else {
        inverted[value as V] = [key as K];
      }
    }
  }
  return inverted;
}
