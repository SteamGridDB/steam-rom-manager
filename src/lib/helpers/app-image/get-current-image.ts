import { PreviewDataAppImage, OnlineImages, ImageProviderType, LocalProviderType, SingleLocalProviderType, MultiLocalProviderType, OnlineProviderType } from "../../../models";
import { singleLocalProviders,multiLocalProviders,onlineProviders, imageProviders } from "../../image-providers/available-providers"


const mod = (l:number, n:number) => n==0 ? 0 : (l % n + n) %n
const orlen = (x: any[]) => x ? x.length : 0;

// return section lengths and total length
export function getMaxLength(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[string]) {
  const singleLocalLengths = Object.fromEntries(singleLocalProviders.map((providerType: SingleLocalProviderType) => {
    return [providerType, previewAppImage.singleProviders[providerType] ? 1 : 0]
  }));
  const multiLocalLengths = Object.fromEntries(multiLocalProviders.map((providerType: MultiLocalProviderType) => {
    return [providerType, orlen(onlineImages[previewAppImage.imagePool].offline[providerType])]
  }));

  const onlineLengths = Object.fromEntries(onlineProviders.map((providerType: OnlineProviderType) => {
    return [providerType, orlen(onlineImages[previewAppImage.imagePool].online[providerType].content)]
  }))
  
  const defaultLength = previewAppImage.default ? 1 : 0;

  const singleLength = Object.values(singleLocalLengths).reduce((x,y) => x+y);
  const multiLength = Object.values(multiLocalLengths).reduce((x,y) => x+y)
  const onlineLength = Object.values(onlineLengths).reduce((x,y)=>x+y)
  const maxLength = Math.max(defaultLength, singleLength + multiLength + onlineLength)
  return { singleLocalLengths, multiLocalLengths, onlineLengths, defaultLength, onlineLength, singleLength, multiLength, maxLength }
}

// Set index modulo max length.
export function setImageIndex(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[string], index: number) {
  const lens = getMaxLength(previewAppImage, onlineImages);
  previewAppImage.imageIndex = mod(index, lens.maxLength)
}

export function getCurrentImage(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[string]) {
  const lens = getMaxLength(previewAppImage, onlineImages)
  if (lens.maxLength !== 0) {
    setImageIndex(previewAppImage, onlineImages, previewAppImage.imageIndex)
    if(lens.maxLength == 1 && lens.defaultLength == 1) {
      return previewAppImage.default
    }
    let integrated=0;
    for(let n=0; n < singleLocalProviders.length; n++) {
      integrated += lens.singleLocalLengths[singleLocalProviders[n]]
      if(previewAppImage.imageIndex < integrated) {
        return previewAppImage.singleProviders[singleLocalProviders[n]]
      }
    }
    let offset = integrated;
    for(let n=0; n < multiLocalProviders.length; n++) {
      integrated += lens.multiLocalLengths[multiLocalProviders[n]]
      if(previewAppImage.imageIndex < integrated) {
        return onlineImages[previewAppImage.imagePool].offline[multiLocalProviders[n]][previewAppImage.imageIndex - offset]
      }
      offset = integrated;
    }
    for(let n=0; n < onlineProviders.length; n++) {
      integrated += lens.onlineLengths[onlineProviders[n]];
      if(previewAppImage.imageIndex < integrated) {
        return onlineImages[previewAppImage.imagePool].online[onlineProviders[n]].content[previewAppImage.imageIndex - offset]
      }
      offset=integrated;
    }
  } else {
    return undefined
  }
}
