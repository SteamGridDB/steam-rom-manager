import { PreviewDataAppImage, AppImages } from "../../../models";
import { getMaxLength } from "./get-max-length";
import { setImageIndex } from "./set-image-index";


export function getCurrentImage(data: PreviewDataAppImage, images: AppImages[string]) {
  let imagesLength = images[data.imagePool] !== undefined ? images[data.imagePool].content.length : 0;
  let length = getMaxLength(data, images);
  if (data.imageIndex !== 0 && data.imageIndex >= length)
    setImageIndex(data, images, data.imageIndex);

  if (imagesLength === 0) {
    if (data.imageIndex === 0 && data.steam !== undefined)
      return data.steam;
    else
      return data.default || undefined;
  }
  else {
    if (data.imageIndex === 0 && data.steam !== undefined)
      return data.steam;
    else
      return images[data.imagePool].content[data.imageIndex - (data.steam === undefined ? 0 : 1)];
  }
}
