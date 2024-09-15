export const wait = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));
