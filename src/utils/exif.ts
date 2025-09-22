/**
 * Maps and extracts useful EXIF data from raw EXIF object
 * @param exifs - The raw EXIF data object from Flickr API
 * @returns Object containing commonly used EXIF values
 */
export function mapExifs(
  exifs:
    | Record<string, { value: string; clean?: string; raw?: string }>
    | undefined
    | null
): Record<string, string | number> {
  if (!exifs || typeof exifs !== "object") {
    return {};
  }

  return {
    model: exifs.Model?.clean || exifs.Model?.value,
    lens: exifs.Lens?.clean || exifs.Lens?.value,
    exposureTime: exifs.ExposureTime?.raw || exifs.ExposureTime?.value,
    fNumber: exifs.FNumber?.clean || exifs.FNumber?.value,
    focalLength: exifs.FocalLength?.clean || exifs.FocalLength?.value,
    iso: exifs.ISO?.clean || exifs.ISO?.value,
  };
}
