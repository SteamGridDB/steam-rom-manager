import { join, resolve } from "path";

export const root = (...args: string[]) => {
  return join(resolve(__dirname, '..'), ...args)
}
