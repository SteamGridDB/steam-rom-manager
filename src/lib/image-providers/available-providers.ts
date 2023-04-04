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
      }
    }
  }
};

export const availableProviders = Object.keys(providerInfo);

export const defaultProviders = ['SteamGridDB'];
