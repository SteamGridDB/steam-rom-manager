// The core does network I/O through an injected fetch, so each host can use
// the right stack: the browser's in a renderer, Electron's net.fetch in the
// main process (system certificates and proxy), a fake in tests.
export interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<any>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type Fetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any; // e.g. FormData
    signal?: AbortSignal;
  },
) => Promise<FetchResponse>;

// The fetch used by lib code that isn't handed one explicitly (e.g. the
// SteamGridDB lookups inside the file parser). Hosts replace it at startup:
// the main process with Electron's net.fetch.
let defaultFetch: Fetch = (url, init) => (globalThis.fetch as any)(url, init);

export function setDefaultFetch(fetch: Fetch) {
  defaultFetch = fetch;
}

export function getDefaultFetch(): Fetch {
  return defaultFetch;
}

export class HttpError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    statusText: string,
  ) {
    super(`HTTP ${status} ${statusText}: ${url}`);
  }
}

export async function getJson<T = any>(
  fetch: Fetch,
  url: string,
  timeoutMs = 5000,
): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new HttpError(url, res.status, res.statusText);
  }
  return res.json();
}
