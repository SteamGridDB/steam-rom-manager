import { PreviewDataAppImage, OnlineImages, ArtworkType, SingleLocalProviderType, MultiLocalProviderType, OnlineProviderType } from "../../../models";
import { singleLocalProviders,multiLocalProviders,onlineProviders, imageProviders } from "../../image-providers/available-providers"


const mod = (l:number, n:number) => n==0 ? 0 : (l % n + n) %n
const orlen = (x: any[]) => x ? x.length : 0;

// return section lengths and total length
export function getMaxLength(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[ArtworkType]) {
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

  const singleLength = Object.values(singleLocalLengths).reduce((x,y) => x+y, 0);
  const multiLength = Object.values(multiLocalLengths).reduce((x,y) => x+y, 0)
  const onlineLength = Object.values(onlineLengths).reduce((x,y) => x+y, 0)
  const maxLength = Math.max(defaultLength, singleLength + multiLength + onlineLength)
  return { singleLocalLengths, multiLocalLengths, onlineLengths, defaultLength, onlineLength, singleLength, multiLength, maxLength }
}

// Set index modulo max length.
export function setImageIndex(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[ArtworkType], imageIndex: number) {
  const lens = getMaxLength(previewAppImage, onlineImages);
  previewAppImage.imageIndex = mod(imageIndex, lens.maxLength)
}

export function getImageRanges(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[ArtworkType]) {
  const lens = getMaxLength(previewAppImage, onlineImages);
  let ranges: {[k: string]: {start: number, end: number}} = {};
  ranges['default'] = {start: 0, end: lens.singleLength + lens.multiLength + lens.onlineLength == 0 ? lens.defaultLength : 0}
  let integrated=0;
  for(let n=0; n < singleLocalProviders.length; n++) {
    ranges[singleLocalProviders[n]] = {start: integrated, end: integrated + lens.singleLocalLengths[singleLocalProviders[n]]}
    integrated = ranges[singleLocalProviders[n]].end;
  }
  for(let n=0; n < multiLocalProviders.length; n++) {
    ranges[multiLocalProviders[n]] = {start: integrated, end: integrated + lens.multiLocalLengths[multiLocalProviders[n]]}
    integrated = ranges[multiLocalProviders[n]].end;
  }
  for(let n=0; n < onlineProviders.length; n++) {
    ranges[onlineProviders[n]] = {start: integrated, end: integrated + lens.onlineLengths[onlineProviders[n]]};
    integrated = ranges[onlineProviders[n]].end;
  }
  return ranges;
}

export function getImage(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[ArtworkType], imageIndex: number) {
  const lens = getMaxLength(previewAppImage, onlineImages)
  if (lens.maxLength !== 0) {
    imageIndex = mod(imageIndex, lens.maxLength);
    if(lens.singleLength+lens.multiLength+lens.onlineLength == 0) {
      return previewAppImage.default
    }
    let integrated=0;
    for(let n=0; n < singleLocalProviders.length; n++) {
      integrated += lens.singleLocalLengths[singleLocalProviders[n]]
      if(imageIndex < integrated) {
        return previewAppImage.singleProviders[singleLocalProviders[n]]
      }
    }
    let offset = integrated;
    for(let n=0; n < multiLocalProviders.length; n++) {
      integrated += lens.multiLocalLengths[multiLocalProviders[n]]
      if(imageIndex < integrated) {
        return onlineImages[previewAppImage.imagePool].offline[multiLocalProviders[n]][imageIndex - offset]
      }
      offset = integrated;
    }
    for(let n=0; n < onlineProviders.length; n++) {
      integrated += lens.onlineLengths[onlineProviders[n]];
      if(imageIndex < integrated) {
        return onlineImages[previewAppImage.imagePool].online[onlineProviders[n]].content[imageIndex - offset]
      }
      offset=integrated;
    }
  } else {
    return undefined
  }
}

export function getCurrentImage(previewAppImage: PreviewDataAppImage, onlineImages: OnlineImages[ArtworkType]) {
  return getImage(previewAppImage, onlineImages, previewAppImage.imageIndex)
}
