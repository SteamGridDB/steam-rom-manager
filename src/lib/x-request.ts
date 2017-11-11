import { xRequestError, xRequestOptions, xRequestOptionsWithUrl, xRequestResolve } from "../models";
import * as Bluebird from 'bluebird';

export class xRequest {
    private cancellingPromises: boolean = false;
    private promiseRef: Bluebird<any>[] = [];

    constructor(private bluebird?: typeof Bluebird, protected timeout: number = 3000) {
        if (bluebird === undefined) {
            this.bluebird = Bluebird.getNewLibraryCopy();

            this.bluebird.config({
                cancellation: true
            });
        }
    }

    get Bluebird() {
        return this.bluebird;
    }

    /* Handle promises and their cancelation */

    private removePromiseRef(promise: Bluebird<any>) {
        if (!this.cancellingPromises) {
            let index = this.promiseRef.indexOf(promise);
            if (index !== -1)
                this.promiseRef.splice(index, 1);
        }
    }

    addPromise(promise: Bluebird<any>) {
        if (this.promiseRef.indexOf(promise) === -1) {
            this.promiseRef.push(promise);
            promise.finally(() => this.removePromiseRef(promise));
        }
        return promise;
    }

    set promise(promise: Bluebird<any>) {
        this.addPromise(promise);
    }

    cancel() {
        this.cancellingPromises = true;
        this.promiseRef.forEach(promise => promise.cancel());
        this.promiseRef = [];
        this.cancellingPromises = false;
    }

    /* Handle new requests */

    protected parseResponseHeaders(headers: string) {
        let parsedHeaders = {};
        if (headers) {
            let headerPairs = headers.split('\u000d\u000a');
            for (let i = 0; i < headerPairs.length; i++) {
                let index = headerPairs[i].indexOf('\u003a\u0020');
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
        return this.Bluebird.delay(delay).then(() => new this.Bluebird<xRequestResolve>(function (resolve, reject, onCancel) {
            let xhr = new XMLHttpRequest();
            let finalUrl = options.url;
            let params = options.params || null;

            if (params && typeof params === 'object') {
                params = Object.keys(params).map(function (key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&');
            }

            if (options.method === 'GET' && params)
                finalUrl = `${finalUrl}?${params}`;

            xhr.responseType = options.responseType || '';

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
                            headers: self.parseResponseHeaders(xhr.getAllResponseHeaders())
                        },
                        response: xhr.response
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
                        headers: self.parseResponseHeaders(xhr.getAllResponseHeaders())
                    }
                });
            };
            xhr.ontimeout = function () {
                reject(<xRequestError>{
                    config: options,
                    error: {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        url: finalUrl,
                        headers: self.parseResponseHeaders(xhr.getAllResponseHeaders())
                    }
                });
            };

            xhr.open(options.method, finalUrl, true);

            if (options.headers) {
                Object.keys(options.headers).forEach(function (key) {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }

            if (options.method === 'GET')
                xhr.send(null);
            else
                xhr.send(params);

            onCancel(() => {
                xhr.abort();
            });
        }));
    }

    request(url: string, options: xRequestOptions, delay: number = 0) {
        (options as xRequestOptionsWithUrl).url = url;
        return this.makeRequest((options as xRequestOptionsWithUrl), delay);
    }

    get(url: string, params?: { [parameter: string]: string }, responseType: XMLHttpRequestResponseType = 'json', delay: number = 0) {
        return this.request(url, { headers: null, method: 'GET', responseType, params, timeout: this.timeout }, delay);
    }
};