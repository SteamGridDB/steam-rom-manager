import { ProviderProxy, GenericProvider } from "./generic-provider";
import { xRequestError } from "../../models";
import { xRequest } from "../x-request";

export class xRequestWrapper<T extends GenericProvider> extends xRequest {
  private specialErrors: {
    [statusCode: string]: { retryCount?: number; silent: boolean };
  } = {};

  constructor(
    private proxy: ProviderProxy<T>,
    private handleErrors: boolean,
    private retryCount: number,
    timeout: number,
  ) {
    super(timeout);
  }

  private canRetry(status: number, config: any) {
    let retryCount = this.specialErrors[`${status}`]
      ? this.specialErrors[`${status}`].retryCount || this.retryCount
      : this.retryCount;

    if (retryCount > 0) {
      if (config["retryCount"] === undefined) {
        config["retryCount"] = 1;
        return true;
      } else return config["retryCount"]++ < retryCount;
    } else return false;
  }

  private errorHandler(promise: Promise<any>): Promise<any> {
    if (this.handleErrors) {
      return promise.catch((data: xRequestError) => {
        if (data.error) {
          if (data.error.status === 429) {
            let timeout = data.error.headers["Retry-After"] || 1;
            this.proxy.timeout(timeout);
            return this.errorHandler(
              this.makeRequest(data.config, timeout * 1000),
            );
          } else if (this.canRetry(data.error.status, data.config))
            return this.errorHandler(this.makeRequest(data.config, 0));
          else {
            if (
              this.specialErrors[`${data.error.status}`] === undefined ||
              !this.specialErrors[`${data.error.status}`].silent
            )
              this.logError(data.error.status, data.error.url);
            return Promise.resolve(null);
          }
        } else return Promise.reject(data);
      });
    } else return promise;
  }

  setSpecialErrors(specialErrors: {
    [statusCode: string]: { retryCount?: number; silent: boolean };
  }) {
    this.specialErrors = specialErrors;
  }

  get(
    url: string,
    params?: { [parameter: string]: string },
    responseType: XMLHttpRequestResponseType = "json",
    delay: number = 0,
  ) {
    return this.errorHandler(
      super.request(
        url,
        {
          method: "GET",
          timeout: this.timeout,
          responseType,
          params,
        },
        delay,
      ),
    );
  }

  logError(value: any, url?: string) {
    if (value.error) this.logError(value.error, url);
    else
      this.proxy.error(
        typeof value === "object"
          ? value.status || JSON.stringify(value)
          : value,
        url,
      );
  }
}
