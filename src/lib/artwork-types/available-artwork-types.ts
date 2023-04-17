export const artworkTypes: string[] = [
  'long',
  'tall',
  'hero',
  'logo',
  'icon'
];

export const defaultArtworkType: string = 'tall'

export const artworkViewTypes: string[] = [
  'long',
  'tall',
  'hero',
  'logo',
  'icon',
  'games'
]

export const artworkDimsDict: {[k: string]: {width: string, height: string}} = {
  long: { width: '920px', height: '430px' },
  tall: { width: '600px', height: '900px' },
  hero: { width: '910px', height: '296px' },
  logo: { width: '960px', height: '540px' },
  icon: { width: '400px', height: '400px' },
  games: { width: '920px', height: '430px' }
}

export const artworkNamesDict: {[k:string]: string} = {
  long: 'Banners',
  tall: 'Portraits',
  hero: 'Heroes',
  logo: 'Logos',
  icon: 'Icons',
  games: 'All Artwork'
};

export const artworkIdDict: {[k: string]: string} = {
  long: '',
  tall: 'p',
  hero: '_hero',
  logo: '_logo',
  icon: '_icon'
}

export const invertedArtworkIdDict: {[k: string]: string} = {
  ['']: 'long',
  ['p']: 'tall',
  ['_hero']: 'hero',
  ['_logo']: 'logo',
  ['_icon']: 'icon'
}
