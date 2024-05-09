export const imageProviders = {
  'sgdb': new Worker(new URL('./steamgriddb.worker', import.meta.url)),
  // 'GoogleImages': new Worker(new URL('./googleimages.worker', import.meta.url))
}
