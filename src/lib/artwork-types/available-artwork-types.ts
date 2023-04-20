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
  long: { width: '920px', height: '430px' },
  hero: { width: '910px', height: '296px' },
  logo: { width: '960px', height: '540px' },
  icon: { width: '400px', height: '400px' },
  games: { width: '920px', height: '430px' }
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
