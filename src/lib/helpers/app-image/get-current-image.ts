import { PreviewDataAppImage, AppImages } from "../../../models";


function mod(l: number, n: number) {
  return n == 0 ? 0 : (l % n + n) % n;
}

export function getMaxLength(data: PreviewDataAppImage, sgdbImages: AppImages[string]) {
  const steamLength = data.steam ? 1 : 0;
  const localLength = data.local ? data.local.length : 0;
  const sgdbLength = sgdbImages[data.imagePool] ? sgdbImages[data.imagePool].content.length : 0;
  const defaultLength = data.default ? 1 : 0; 
  return {
    maxLength: Math.max(steamLength+localLength+sgdbLength, defaultLength),
    steamLength: steamLength,
    localLength: localLength,
    sgdbLength: sgdbLength,
    defaultLength: defaultLength
  }
}

export function setImageIndex(data: PreviewDataAppImage, sgdbImages: AppImages[string], index: number) {
  const lens = getMaxLength(data, sgdbImages);
  data.imageIndex = mod(index, lens.maxLength)
}

export function getCurrentImage(data: PreviewDataAppImage, sgdbImages: AppImages[string]) {
  const lens = getMaxLength(data, sgdbImages)

  if (lens.maxLength !== 0) {
    setImageIndex(data, sgdbImages, data.imageIndex)
    if(lens.steamLength + lens.localLength + lens.sgdbLength == 0) {
      return data.default;
    } else if(data.imageIndex < lens.steamLength) {
      return data.steam
    } else if(data.imageIndex < lens.steamLength + lens.localLength) {
      return data.local[data.imageIndex - lens.steamLength]
    } else {
      return sgdbImages[data.imagePool].content[data.imageIndex - lens.steamLength - lens.localLength]
    }
  } else {
    return undefined
  }
}
