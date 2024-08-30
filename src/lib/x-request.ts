import {
  xRequestError,
  xRequestOptions,
  xRequestOptionsWithUrl,
  xRequestResolve,
  StringMap,
} from "../models";

const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

export class xRequest {
  private cancellingPromises: boolean = false;
  /**
   * maps generated Promises in `makeRequest` to their `cancel` method
   */
  private cancelHandlerMap = new WeakMap<
    Promise<any>,
    () => void | undefined
  >();
  private promiseRef = new Set<Promise<any>>();
  private defaultTimeout: number;

  constructor(protected timeout: number = 3000) {
    this.defaultTimeout = timeout;
  }

  /* Handle promises and their cancelation */

  private removePromiseRef(promise: Promise<any>) {
    if (!this.cancellingPromises) {
      this.promiseRef.delete(promise);
    }
  }

  addPromise(promise: Promise<any>) {
    if (!this.promiseRef.has(promise)) {
      this.promiseRef.add(promise);
      promise.finally(() => this.removePromiseRef(promise));
    }
    return promise;
  }

  set promise(promise: Promise<any>) {
    this.addPromise(promise);
  }

  cancel() {
    this.cancellingPromises = true;
    this.promiseRef.forEach((promise) => {
      const cancel = this.cancelHandlerMap.get(promise);
      cancel?.();
    });
    this.promiseRef.clear();
    this.cancellingPromises = false;
  }

  /* Handle new requests */

  protected parseResponseHeaders(headers: string) {
    let parsedHeaders: { [k: string]: string } = {};
    if (headers) {
      let headerPairs = headers.split("\u000d\u000a");
      for (let i = 0; i < headerPairs.length; i++) {
        let index = headerPairs[i].indexOf("\u003a\u0020");
        if (index > 0) {
          let key = headerPairs[i].substring(0, index);
          let val = headerPairs[i].substring(index + 2);
          parsedHeaders[key] = val;
        }
      }
    }
    return parsedHeaders;
  }

  protected makeRequest(options: xRequestOptionsWithUrl, delay: number) {
    let self = this;
    let cancel: () => void | undefined;

    const promise = wait(delay).then(
      () =>
        new Promise<xRequestResolve>(function (resolve, reject) {
          let xhr = new XMLHttpRequest();
          let finalUrl = options.url;
          let paramsString: string = null;
          if (options.params) {
            if (typeof options.params === "string") {
              paramsString = options.params || null;
            } else {
              paramsString = Object.keys(options.params)
                .map(function (key) {
                  return (
                    encodeURIComponent(key) +
                    "=" +
                    encodeURIComponent((options.params as StringMap)[key])
                  );
                })
                .join("&");
            }
          }

          if (options.method === "GET" && paramsString)
            finalUrl = `${finalUrl}?${paramsString}`;

          xhr.responseType = options.responseType || "";
          xhr.timeout =
            options.timeout !== undefined
              ? options.timeout
              : self.defaultTimeout;

          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(<xRequestError>{
                config: options,
                error: {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  url: finalUrl,
                  headers: self.parseResponseHeaders(
                    xhr.getAllResponseHeaders(),
                  ),
                },
                response: xhr.response,
              });
            }
          };
          xhr.onerror = function () {
            reject(<xRequestError>{
              config: options,
              error: {
                status: xhr.status,
                statusText: xhr.statusText,
                url: finalUrl,
                headers: self.parseResponseHeaders(xhr.getAllResponseHeaders()),
              },
            });
          };
          xhr.ontimeout = function () {
            reject(<xRequestError>{
              config: options,
              error: {
                status: xhr.status,
                statusText: xhr.statusText,
                url: finalUrl,
                headers: self.parseResponseHeaders(xhr.getAllResponseHeaders()),
              },
            });
          };

          xhr.open(options.method, finalUrl, true);

          if (options.headers) {
            Object.keys(options.headers).forEach(function (key) {
              xhr.setRequestHeader(key, options.headers[key]);
            });
          }

          if (options.method === "GET") xhr.send(null);
          else if (options.method === "POST" && options.body)
            xhr.send(options.body);
          else xhr.send(paramsString);

          cancel = () => {
            xhr.abort();
          };
        }),
    );

    this.cancelHandlerMap.set(promise, cancel);

    return promise;
  }

  request(url: string, options: xRequestOptions, delay: number = 0) {
    (options as xRequestOptionsWithUrl).url = url;
    return this.makeRequest(options as xRequestOptionsWithUrl, delay);
  }

  get(
    url: string,
    params?: { [parameter: string]: string },
    responseType: XMLHttpRequestResponseType = "json",
    delay: number = 0,
  ) {
    return this.request(
      url,
      {
        headers: null,
        method: "GET",
        responseType,
        params,
        timeout: this.timeout,
      },
      delay,
    );
  }
}
