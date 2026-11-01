import {
  ArtworkType,
  ImageContent,
  MultiLocalProviderType,
  OnlineImages,
  PreviewData,
  initArtworkRecord,
} from "../models";
import { artworkTypes } from "../lib/artwork-types";

// Artwork pools: per artwork type, the candidate images for each image pool
// (usually a game title), from online providers and local sources.

export function emptyPools(): OnlineImages {
  return initArtworkRecord<OnlineImages[ArtworkType]>(() => ({}));
}

// Adds a local/manual/imported image to a pool unless it's already there;
// returns the stored image, or null.
export function addUniqueLocalImage(
  pools: OnlineImages,
  imageKey: string,
  content: ImageContent,
  artworkType: ArtworkType,
  provider: MultiLocalProviderType,
  preinsert?: boolean,
): ImageContent | null {
  const pool = pools[artworkType][imageKey];
  if (
    !pool ||
    pool.offline[provider].some((item) => item.imageUrl === content.imageUrl)
  ) {
    return null;
  }
  const images = pool.offline[provider];
  if (preinsert) {
    images.unshift(content);
    return images[0];
  }
  images.push(content);
  return images[images.length - 1];
}

// A refresh's new pools, keeping what the previous list already had: a pool
// searched the same way whose lookups all finished keeps its online
// artwork, and any pool still there keeps the images added by hand.
// Returns, per artwork type, the pools that still need looking up.
export function keepRetrievedPools(
  previous: OnlineImages | undefined,
  pools: OnlineImages,
): Record<ArtworkType, string[]> {
  const search = (pool: OnlineImages[ArtworkType][string]) =>
    JSON.stringify([
      pool.parserEnabledProviders,
      Object.entries(pool.online).map(([provider, x]) => [
        provider,
        x.searchQueries,
        x.imageProviderAPIs,
      ]),
    ]);
  const toLookUp = initArtworkRecord<string[]>(() => []);
  for (const artworkType of artworkTypes) {
    for (const [key, pool] of Object.entries(pools[artworkType])) {
      const old = previous?.[artworkType]?.[key];
      if (old) {
        pool.offline.manual = old.offline.manual;
        pool.offline.imported = old.offline.imported;
      }
      if (old?.retrieved && search(old) === search(pool)) {
        pool.online = old.online;
        pool.retrieved = true;
      } else {
        toLookUp[artworkType].push(key);
      }
    }
  }
  return toLookUp;
}

// Keeps the artwork picked for each game that's still in the list (same
// Steam user, app id and pool).
export function keepArtworkPicks(
  previous: PreviewData | undefined,
  previewData: PreviewData,
) {
  for (const [steamDir, users] of Object.entries(previewData)) {
    for (const [userId, user] of Object.entries(users)) {
      for (const [appId, app] of Object.entries(user.apps)) {
        const old = previous?.[steamDir]?.[userId]?.apps?.[appId];
        if (!old) continue;
        for (const [artworkType, image] of Object.entries(app.images)) {
          const oldImage = old.images[artworkType as ArtworkType];
          if (image && oldImage && oldImage.imagePool === image.imagePool) {
            image.imageIndex = oldImage.imageIndex;
          }
        }
      }
    }
  }
}
