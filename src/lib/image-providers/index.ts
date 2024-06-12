export const imageProviders = {
  'sgdb': new Worker(new URL('./steamgriddb.worker', import.meta.url), {name: 'sgdb'}),
  'steamCDN': new Worker(new URL('./steamcdn.worker', import.meta.url), {name: 'steamCDN'})
}
