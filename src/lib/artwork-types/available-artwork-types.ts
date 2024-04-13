export const artworkTypes: string[] = [
  'tall',
  'long',
  'hero',
  'logo',
  'icon'
];

export const defaultArtworkType: string = 'tall'

export const artworkViewTypes: string[] = [
  'tall',
  'long',
  'hero',
  'logo',
  'icon',
  'games'
]

export const artworkDimsDict: {[k: string]: {width: string, height: string}} = {
  tall: { width: '600px', height: '900px' },
  long: { width: '1196px', height: '559px' }, // 920x430 x 1.3
  hero: { width: '1920px', height: '620px' },
  logo: { width: '960px', height: '540px' },
  icon: { width: '600px', height: '600px' },
  games: { width: '1196px', height: '559px' } // 920x430 x 1.3
}

export const artworkNamesDict: {[k:string]: string} = {
  tall: 'Portraits',
  long: 'Banners',
  hero: 'Heroes',
  logo: 'Logos',
  icon: 'Icons',
  games: 'All Artwork'
};

export const artworkSingDict: {[k:string]: string} = {
  tall: 'portrait',
  long: 'banner',
  hero: 'hero',
  logo: 'logo',
  icon: 'icon'
};

export const artworkIdDict: {[k: string]: string} = {
  tall: 'p',
  long: '',
  hero: '_hero',
  logo: '_logo',
  icon: '_icon'
}

export const invertedArtworkIdDict: {[k: string]: string} = {
  ['p']: 'tall',
  ['']: 'long',
  ['_hero']: 'hero',
  ['_logo']: 'logo',
  ['_icon']: 'icon'
}
