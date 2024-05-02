import { ProviderInfo } from '../../models';
import { APP } from '../../variables';
// necessary to split this out because of ts-node .validate-files
export const providerInfoLang: ProviderInfo = {
  SteamGridDB: {
    info: APP.lang.sgdbProvider.docs__md.self.join(''),
    inputs: {
      nsfw: {
        label: APP.lang.sgdbProvider.nsfwInputTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      humor: {
        label: APP.lang.sgdbProvider.humorInputTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      styles: {
        label: APP.lang.sgdbProvider.stylesTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      stylesHero: {
        label: APP.lang.sgdbProvider.stylesHeroTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      stylesLogo: {
        label: APP.lang.sgdbProvider.stylesLogoTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      stylesIcon: {
        label: APP.lang.sgdbProvider.stylesIconTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      imageMotionTypes: {
        label: APP.lang.sgdbProvider.imageMotionTypesTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      sizes: {
        label: APP.lang.sgdbProvider.sizesTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      sizesHero: {
        label: APP.lang.sgdbProvider.sizesHeroTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      },
      sizesIcon: {
        label: APP.lang.sgdbProvider.sizesIconTitle,
        info: APP.lang.sgdbProvider.docs__md.input.join('')
      }
    }
  }
};

