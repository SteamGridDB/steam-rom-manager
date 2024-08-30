const Memoize = require("fast-memoize");

export class MemoizedFunction<FunctionType = Function> {
  private static fnFallback = () => {
    throw new Error("memoized function is used before being set.");
  };
  private cache: { [key: string]: any } = {};
  private memoizedFn!: FunctionType;

  constructor() {
    this.clearFunction().clearCache();
  }

  public memoize(fn: FunctionType, isVariadicFunction: boolean) {
    this.memoizedFn = Memoize(fn, {
      cache: {
        create: () => {
          return {
            get: (key: string) => this.cache[key],
            has: (key: string) => this.cache[key] !== undefined,
            set: (key: string, value: string) => (this.cache[key] = value),
          };
        },
      },
      strategy: isVariadicFunction ? Memoize.strategies.variadic : undefined,
    });
    return this;
  }

  public setCache(object: { [key: string]: string }) {
    this.cache = object;
    return this;
  }

  public getCache() {
    return this.cache;
  }

  get fn() {
    return this.memoizedFn;
  }

  public clearCache() {
    this.cache = {};
    return this;
  }

  public clearFunction() {
    this.memoizedFn = MemoizedFunction.fnFallback as any;
    return this;
  }
}
