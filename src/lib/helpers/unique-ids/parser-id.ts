export function newParserId() {
  return Date.now()
    .toString()
    .concat(Math.floor(Math.random() * 100000).toString());
}
