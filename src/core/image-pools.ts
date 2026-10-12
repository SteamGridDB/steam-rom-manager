import {
  ArtworkType,
  ImageContent,
  MultiLocalProviderType,
  OnlineImages,
  initArtworkRecord,
} from "../models";

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
