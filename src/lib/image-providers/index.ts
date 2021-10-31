export const imageProviders = {
  'SteamGridDB': new Worker(new URL('./steamgriddb.worker', import.meta.url)),
  // 'GoogleImages': new Worker(new URL('./googleimages.worker', import.meta.url))
}
