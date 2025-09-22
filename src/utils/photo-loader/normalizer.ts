import { SIZES } from "./constants";
import type { FlickrPhoto, PhotoData } from "./types";

/**
 * Normalizes a Flickr photo object into the standardized PhotoData format
 * @param photo - The raw Flickr photo object from the API
 * @returns A normalized PhotoData object with standardized structure and types
 */
export function normalizePhoto(photo: FlickrPhoto): PhotoData {
  if (!photo.url_o || !photo.width_o || !photo.height_o) {
    throw new Error(`Photo ${photo.id} is missing required original size data`);
  }

  const imageUrls: PhotoData["imageUrls"] = {
    original: {
      url: photo.url_o,
      width: photo.width_o,
      height: photo.height_o,
      orientation: photo.orientation || "landscape",
    },
  };

  for (const [sizeCode, sizeKey] of Object.entries(SIZES)) {
    const urlKey = `url_${sizeCode}` as keyof FlickrPhoto;
    const heightKey = `height_${sizeCode}` as keyof FlickrPhoto;
    const widthKey = `width_${sizeCode}` as keyof FlickrPhoto;

    const url = photo[urlKey];
    const height = photo[heightKey];
    const width = photo[widthKey];

    if (url && height && width) {
      const widthNum =
        typeof width === "number" ? width : parseInt(String(width), 10);
      const heightNum =
        typeof height === "number" ? height : parseInt(String(height), 10);

      imageUrls[sizeKey as keyof typeof imageUrls] = {
        url: String(url),
        width: widthNum,
        height: heightNum,
        orientation:
          widthNum === heightNum
            ? "square"
            : widthNum > heightNum
              ? "landscape"
              : "portrait",
      };
    }
  }

  const title =
    typeof photo.title === "string" ? photo.title : photo.title?._content || "";
  const description = photo.description?._content;
  const date_taken = photo.datetaken ? new Date(photo.datetaken) : new Date();
  const latitude = parseFloat(photo.latitude || "0");
  const longitude = parseFloat(photo.longitude || "0");

  return {
    id: photo.id,
    title,
    description,
    date_taken,
    latitude,
    longitude,
    imageUrls,
    exif: {},
  };
}
