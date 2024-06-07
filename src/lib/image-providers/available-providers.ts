import { ProviderInfo, ImageProviderType, LocalProviderType, OnlineProviderType, SingleLocalProviderType, MultiLocalProviderType, ImageProviderName, ProviderCategoryType } from '../../models';

export const providerCategories = [
  'default',
  'single',
  'multi',
  'online'
] as const;

export const defaultProviders = ['default'] as const;

export const singleLocalProviders = [
  'steam',
  'artworkBackup'
] as const

export const multiLocalProviders = [
  'local',
  'imported',
  'manual'
] as const

export const localProviders: LocalProviderType[] =  [...singleLocalProviders, ...multiLocalProviders]

export const onlineProviders = [
  'sgdb',
  'steamCDN'
] as const;

export const imageProviders: ImageProviderType[] = [...localProviders, ...onlineProviders];

export const imageProviderNames: Record<ImageProviderType, ImageProviderName> = {
  default: 'Fallback Artwork',
  steam: 'Current Artwork',
  artworkBackup: 'Backup Artwork',
  local: 'Local Artwork',
  imported: 'Imported Artwork',
  manual: 'Manually Added',
  sgdb: 'SteamGridDB',
  steamCDN: 'Steam Official'
}

export const allProviders: Record<ProviderCategoryType,
(typeof singleLocalProviders)|(typeof multiLocalProviders)|(typeof onlineProviders)|(typeof defaultProviders)> = {
  default: defaultProviders,
  single: singleLocalProviders,
  multi: multiLocalProviders,
  online: onlineProviders
}


export const providerInfo: ProviderInfo = {
  sgdb: {
    inputs: {
      nsfw: {
        inputType: 'toggle',
      },
      humor: {
        inputType: 'toggle',
      },
      styles: {
        inputType: 'multiselect',
        allowedValues: ['alternate', 'blurred', 'white_logo', 'material', 'no_logo'],
        multiple: true,
        allowEmpty: true,
      },
      stylesHero: {
        inputType: 'multiselect',
        allowedValues: ['alternate', 'blurred', 'material'],
        multiple: true,
        allowEmpty: true,
      },
      stylesLogo: {
        inputType: 'multiselect',
        allowedValues: ['official', 'white', 'black', 'custom'],
        multiple: true,
        allowEmpty: true,
      },
      stylesIcon: {
        inputType: 'multiselect',
        allowedValues: ['official','custom'],
        multiple: true,
        allowEmpty: true,
      },
      imageMotionTypes: {
        inputType: 'multiselect',
        allowedValues: ['static', 'animated'],
        multiple: true,
        allowEmpty: false,
      },
      sizes: {
        inputType: 'multiselect',
        allowedValues: ['460x215','920x430'],
        multiple: true,
        allowEmpty: true
      },
      sizesHero: {
        inputType: 'multiselect',
        allowedValues: ["1920x620","3840x1240"],
        multiple: true,
        allowEmpty: true
      },
      sizesIcon: {
        inputType: 'multiselect',
        allowedValues: ["8","10","14","16","20","24","28","32","35","40","48","54","56","57","60","64","72","76","80","90","96","100",
        "114","120","128","144","150","152","160","180","192","194","256","310","512","768","1024"],
        multiple: true,
        allowEmpty: true
      }
    }
  },
  steamCDN: {
    inputs: {
      
    }
  }
};

export const providersSelect = onlineProviders.map((provider)=>{
  return {value: provider, displayValue: imageProviderNames[provider]}
})

export const dnsSelect = [
  {value: '1.1.1.1', displayValue: 'Cloudflare'},
  {value: '1.0.0.1', displayValue: 'Cloudflare (Alt)'},
  {value: '8.8.8.8', displayValue: 'Google'},
  {value: '8.8.4.4', displayValue: 'Google (Alt)'},

]

export const sgdbIdRegex: RegExp = /^\$\{gameid\:([0-9]*?)\}$/;
