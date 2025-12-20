import { SIZES } from "./constants";
import type { FlickrPhoto, PhotoData, PhotoMetadata } from "./types";

/**
 * Parses metadata from a description field
 * Format: description text followed by --- and key: value pairs
 * Examples:
 *   My photo description.
 *   ---
 *   roll: paris-2024
 *   film: portra400
 *
 * Or metadata-only (no description):
 *   ---
 *   roll: paris-2024
 *   film: portra400
 */
function parseDescriptionMetadata(description: string): {
  cleanDescription: string;
  metadata: PhotoMetadata;
} {
  const metadata: PhotoMetadata = {};
  let cleanDescription = description;

  // Look for --- separator (either at start or after newline)
  const startsWithSeparator = description.startsWith("---");
  const separatorIndex = startsWithSeparator ? 0 : description.indexOf("\n---");

  if (separatorIndex !== -1) {
    cleanDescription = startsWithSeparator
      ? ""
      : description.substring(0, separatorIndex).trim();
    const metadataSection = description.substring(
      startsWithSeparator ? 3 : separatorIndex + 4
    );

    // Parse key: value pairs
    const lines = metadataSection.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([a-z_]+)\s*:\s*(.+?)\s*$/i);
      if (match) {
        const [, key, value] = match;
        metadata[key.toLowerCase()] = value;
      }
    }
  }

  return { cleanDescription, metadata };
}

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
  const rawDescription = photo.description?._content || "";
  const { cleanDescription, metadata } =
    parseDescriptionMetadata(rawDescription);
  const date_taken = photo.datetaken ? new Date(photo.datetaken) : new Date();
  const latitude = parseFloat(photo.latitude || "0");
  const longitude = parseFloat(photo.longitude || "0");
  const tags = photo.tags
    ? photo.tags.split(" ").filter((tag) => tag.length > 0)
    : [];

  return {
    id: photo.id,
    title,
    description: cleanDescription || undefined,
    date_taken,
    latitude,
    longitude,
    tags,
    metadata,
    imageUrls,
    exif: {},
  };
}
