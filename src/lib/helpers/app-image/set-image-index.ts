import { PreviewDataAppImage, AppImages } from "../../../models";
import { getMaxLength } from "./get-max-length";

export function setImageIndex(data: PreviewDataAppImage, images: AppImages[string], index: number) {
    let currentIndex = data.imageIndex;
    let length = getMaxLength(data, images);
    if (index < 0)
        index = length > 0 ? length - 1 : 0;
    else if (index >= length)
        index = 0;

    data.imageIndex = index;
}
