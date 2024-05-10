export const imageProviders = {
  'steamCDN': new Worker(new URL('./steamCDN.worker', import.meta.url)),
  'sgdb': new Worker(new URL('./steamgriddb.worker', import.meta.url)),
}
