import { StringMap } from "./parser.model";

export interface xRequestOptions {
  method: "GET" | "POST";
  timeout: number;
  params?: String | StringMap;
  body?: any;
  responseType?: XMLHttpRequestResponseType;
  headers?: StringMap;
}

export interface xRequestOptionsWithUrl extends xRequestOptions {
  url: string;
}

export interface xRequestError {
  config: xRequestOptionsWithUrl;
  response?: xRequestResponse;
  error: {
    status: number;
    statusText: string;
    url: string;
    headers: StringMap;
  };
}

export type xRequestResponse = any;
export type xRequestResolve = xRequestResponse | null;
export type xRequestReject = xRequestError | any;
