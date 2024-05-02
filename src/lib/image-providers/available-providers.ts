import { ProviderInfo } from '../../models';
export const providerInfo: ProviderInfo = {
  SteamGridDB: {
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
  }
};

export const availableProviders = Object.keys(providerInfo);

export const defaultProviders = ['SteamGridDB'];
