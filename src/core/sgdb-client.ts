import { Fetch, HttpError } from "./http";
import { apiKey } from "../lib/image-providers/api-key";

// The parts of the SteamGridDB v2 API SRM uses, over an injected fetch.
// Mirrors the `steamgriddb` npm client's requests (which used axios).

export interface SgdbArtworkQuery {
  type: "game" | "steam";
  id: number;
  styles?: string[];
  dimensions?: string[];
  mimes?: string[];
  types?: string[];
  nsfw?: string;
  humor?: string;
  epilepsy?: string;
}

const multiParams = ["styles", "dimensions", "mimes", "types", "platformdata"];
const singleParams = ["nsfw", "humor", "epilepsy", "oneoftag", "page"];

function buildQuery(options: { [key: string]: any } = {}) {
  const params = new URLSearchParams();
  for (const key of multiParams) {
    if (options[key]?.length) {
      params.set(key, options[key].join(","));
    }
  }
  for (const key of singleParams) {
    if (typeof options[key] !== "undefined") {
      params.set(key, String(options[key]));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export class SgdbClient {
  constructor(
    private fetch: Fetch,
    private key: string = apiKey,
    private baseURL: string = "https://www.steamgriddb.com/api/v2",
  ) {}

  private async get(path: string, timeoutMs = 30000): Promise<any> {
    const url = `${this.baseURL}${path}`;
    const res = await this.fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${this.key}` },
      signal: AbortSignal.timeout(timeoutMs),
    });
    let body: any = null;
    try {
      body = await res.json();
    } catch (e) {}
    if (!res.ok) {
      const error = new HttpError(url, res.status, res.statusText);
      if (body?.errors?.length) {
        error.message = body.errors.join(", ");
      }
      throw error;
    }
    if (body?.success) {
      return body.data ?? body.success;
    }
    throw new Error(body?.errors?.join(", ") ?? "Unknown SteamGridDB error.");
  }

  searchGame(query: string): Promise<any[]> {
    return this.get(`/search/autocomplete/${encodeURIComponent(query)}`);
  }

  getGameById(id: number, params?: { platformdata?: string[] }) {
    return this.get(`/games/id/${id}${buildQuery(params)}`);
  }

  getGrids(options: SgdbArtworkQuery): Promise<any[]> {
    return this.get(
      `/grids/${options.type}/${options.id}${buildQuery(options)}`,
    );
  }

  getHeroes(options: SgdbArtworkQuery): Promise<any[]> {
    return this.get(
      `/heroes/${options.type}/${options.id}${buildQuery(options)}`,
    );
  }

  getLogos(options: SgdbArtworkQuery): Promise<any[]> {
    return this.get(
      `/logos/${options.type}/${options.id}${buildQuery(options)}`,
    );
  }

  getIcons(options: SgdbArtworkQuery): Promise<any[]> {
    return this.get(
      `/icons/${options.type}/${options.id}${buildQuery(options)}`,
    );
  }
}
