import { PreviewDataAppImage, AppImages } from "../../../models";

export function getMaxLength(data: PreviewDataAppImage, images: AppImages[string]) {
    let imagesLength = images[data.imagePool] !== undefined ? images[data.imagePool].content.length : 0;
    if (data.default !== undefined && imagesLength === 0)
        imagesLength++;
    if (data.steam !== undefined)
        imagesLength++;
    return imagesLength;
}
