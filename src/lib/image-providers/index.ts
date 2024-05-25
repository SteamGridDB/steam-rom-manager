export const imageProviders = {
  'steamCDN': new Worker(new URL('./steamcdn.worker', import.meta.url), {name: 'steamCDN'}),
  'sgdb': new Worker(new URL('./steamgriddb.worker', import.meta.url), {name: 'sgdb'}),
}
