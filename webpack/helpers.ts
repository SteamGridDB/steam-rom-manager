import { resolve } from "path";

export const root = (...args: string[]) => {
  return resolve(__dirname, "..", ...args);
};
