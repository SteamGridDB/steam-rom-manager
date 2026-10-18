import { queue, QueueObject } from "async";
import { Subject } from "rxjs";
import {
  ImageProviderAPI,
  OnlineProviderType,
  ProviderCallback,
} from "../models";
import {
  imageProviderNames,
  onlineProviders,
  providerInfo,
  sgdbIdRegex,
} from "../lib/image-providers/available-providers";
import { providerInfoLang } from "../lib/image-providers/available-providers-lang";
import { steamArtworkDict } from "../lib/artwork-types";
import { Fetch, HttpError } from "./http";
import { SgdbClient } from "./sgdb-client";

// Online artwork lookups (SteamGridDB, Steam's CDN). Replaces the old
// Web Worker providers with plain async code; the callback events are the
// same: "image" for each result, "error", then always "completed".

interface ProviderTask {
  title: string;
  imageType: string;
  imageProviderAPIs: ImageProviderAPI[OnlineProviderType];
  emit: ProviderCallback;
}

type Provider = (task: ProviderTask) => Promise<void>;

// A parser's SteamGridDB options (see providerInfo.sgdb.inputs).
interface SgdbOptions {
  nsfw?: boolean;
  humor?: boolean;
  imageMotionTypes?: string[];
  styles?: string[];
  stylesHero?: string[];
  stylesLogo?: string[];
  stylesIcon?: string[];
  sizes?: string[];
  sizesTall?: string[];
  sizesHero?: string[];
  sizesIcon?: string[];
}

function reportError(
  task: ProviderTask,
  provider: OnlineProviderType,
  error: unknown,
) {
  task.emit("error", {
    provider,
    title: task.title,
    error:
      error instanceof HttpError
        ? error.status
        : error instanceof Error
          ? error.message
          : String(error),
    url: error instanceof HttpError ? error.url : undefined,
  });
}

// SteamGridDB lookups shared by every artwork type and provider of a run:
// one search per title and one game per id, not one per (type, provider).
// Cleared when lookups stop (each new list starts fresh).
class SgdbLookups {
  private ids = new Map<string, Promise<number | undefined>>();
  private games = new Map<number, Promise<any>>();

  constructor(readonly client: SgdbClient) {}

  // The game id for a title (or an explicit ${gameid:N}).
  gameId(title: string) {
    if (!this.ids.has(title)) {
      this.ids.set(title, this.search(title));
    }
    return this.ids.get(title);
  }

  private async search(title: string) {
    if (sgdbIdRegex.test(title)) {
      return parseInt(title.match(sgdbIdRegex)[1]);
    }
    // URL encode plus signs to fix search issues with titles ending in "+"
    const results = await this.client.searchGame(title.replace(/\+/g, "%2B"));
    return (results[0] || {}).id as number | undefined;
  }

  // The game with its Steam platform data.
  steamGame(id: number) {
    if (!this.games.has(id)) {
      this.games.set(
        id,
        this.client.getGameById(id, { platformdata: ["steam"] }),
      );
    }
    return this.games.get(id);
  }

  clear() {
    this.ids.clear();
    this.games.clear();
  }
}

function noMatch(task: ProviderTask, provider: OnlineProviderType) {
  // Only report once per title, not once per artwork type.
  if (task.imageType === "long") {
    reportError(
      task,
      provider,
      `SGDB found no matching games for title "${task.title}"`,
    );
  }
}

function sgdbProvider(lookups: SgdbLookups): Provider {
  const { client } = lookups;
  return async (task) => {
    const id = await lookups.gameId(task.title);
    if (!id) {
      return noMatch(task, "sgdb");
    }
    const apis = task.imageProviderAPIs as SgdbOptions;
    const params = {
      id,
      type: "game" as const,
      types: apis.imageMotionTypes,
      nsfw: apis.nsfw ? "any" : "false",
      humor: apis.humor ? "any" : "false",
    };
    const choose = (x: string[], fallback: string[]) =>
      x && x.length ? x : fallback;
    let results: any[];
    switch (task.imageType) {
      case "long":
        results = await client.getGrids({
          ...params,
          dimensions: choose(apis.sizes, ["460x215", "920x430"]),
          styles: apis.styles,
        });
        break;
      case "tall":
        results = await client.getGrids({
          ...params,
          dimensions: choose(apis.sizesTall, ["600x900"]),
          styles: apis.styles,
        });
        break;
      case "hero":
        results = await client.getHeroes({
          ...params,
          dimensions: choose(apis.sizesHero, null),
          styles: apis.stylesHero,
        });
        break;
      case "logo":
        results = await client.getLogos({ ...params, styles: apis.stylesLogo });
        break;
      case "icon":
        results = await client.getIcons({
          ...params,
          dimensions: choose(apis.sizesIcon, null),
          styles: apis.stylesIcon,
        });
        break;
    }
    for (const result of results || []) {
      task.emit("image", {
        provider: "sgdb",
        content: {
          imageProvider: imageProviderNames.sgdb,
          imageUrl: result.url,
          imageGameId: String(id),
          imageArtworkId: String(result.id),
          imageUploader: result.author.name,
          loadStatus: "notStarted",
        },
      });
    }
  };
}

// The first CDN url for this artwork type that actually exists.
async function steamCdnUrl(
  fetch: Fetch,
  steamId: number,
  metadata: Record<string, any>,
  artworkType: keyof typeof steamArtworkDict,
): Promise<string | undefined> {
  let file: string;
  if (artworkType === "long") {
    file = metadata["header_image_full"]["english"];
  } else {
    const entry = metadata[steamArtworkDict[artworkType]];
    file = entry["image2x"]
      ? entry["image2x"]["english"]
      : entry["image"]["english"];
  }
  const url = `https://shared.steamstatic.com/store_item_assets/steam/apps/${steamId}/${file}`;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return url;
  } catch {
    // network error: treat as missing
  }
  return undefined;
}

function steamCdnProvider(lookups: SgdbLookups, fetch: Fetch): Provider {
  return async (task) => {
    const id = await lookups.gameId(task.title);
    if (!id) {
      return noMatch(task, "steamCDN");
    }
    const game = await lookups.steamGame(id);
    const steam = game?.external_platform_data?.steam;
    if (!steam?.length) {
      return;
    }
    const { id: steamId, metadata } = steam[0];
    if (!steamId) {
      return;
    }
    if (task.imageType === "icon" && metadata.clienticon) {
      task.emit("image", {
        provider: "steamCDN",
        content: {
          imageProvider: imageProviderNames.steamCDN,
          imageUrl: `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${steamId}/${metadata.clienticon}.ico`,
          loadStatus: "notStarted",
        },
      });
      return;
    }
    if (!(task.imageType in steamArtworkDict)) {
      return;
    }
    const url = await steamCdnUrl(
      fetch,
      steamId,
      metadata,
      task.imageType as keyof typeof steamArtworkDict,
    );
    if (url) {
      task.emit("image", {
        provider: "steamCDN",
        content: {
          imageProvider: imageProviderNames.steamCDN,
          imageUrl: url,
          loadStatus: "notStarted",
        },
      });
    } else {
      reportError(
        task,
        "steamCDN",
        `No valid CDN artwork found for type "${task.imageType}"`,
      );
    }
  };
}

const concurrency = 10;

export class ArtworkProviders {
  private providers: Record<OnlineProviderType, Provider>;
  private queues = {} as Record<OnlineProviderType, QueueObject<ProviderTask>>;
  // Bumped by stopUrlDownload(); results from older lookups are dropped.
  private generation = 0;
  private stopped = new Subject<void>();
  private lookups: SgdbLookups;

  constructor(fetch: Fetch) {
    this.lookups = new SgdbLookups(new SgdbClient(fetch));
    this.providers = {
      sgdb: sgdbProvider(this.lookups),
      steamCDN: steamCdnProvider(this.lookups, fetch),
    };
    for (const name of onlineProviders) {
      this.queues[name] = this.createQueue(name);
    }
  }

  private createQueue(name: OnlineProviderType) {
    return queue<ProviderTask>((task, done) => {
      this.providers[name](task)
        .catch((error) => reportError(task, name, error))
        .finally(() => {
          task.emit("completed", { title: task.title });
          done();
        });
    }, concurrency);
  }

  get stopEvent() {
    return this.stopped.asObservable();
  }

  getAvailableProviders() {
    return onlineProviders;
  }

  getProviderInfo(provider: OnlineProviderType) {
    return providerInfo[provider];
  }

  getProviderInfoLang(provider: OnlineProviderType) {
    return providerInfoLang[provider];
  }

  retrieveUrls(
    title: string,
    imageType: string,
    imageProviderAPIs: ImageProviderAPI[OnlineProviderType],
    provider: OnlineProviderType,
    eventCallback: ProviderCallback,
  ) {
    if (!this.queues[provider]) {
      eventCallback("completed", { title });
      return;
    }
    const generation = this.generation;
    const emit: ProviderCallback = (event, data) => {
      if (generation === this.generation) {
        eventCallback(event, data);
      }
    };
    this.queues[provider].push({ title, imageType, imageProviderAPIs, emit });
  }

  // Abandons all pending and in-flight lookups.
  stopUrlDownload() {
    this.generation++;
    this.lookups.clear();
    for (const name of onlineProviders) {
      this.queues[name].kill();
      this.queues[name] = this.createQueue(name);
    }
    this.stopped.next();
  }
}
