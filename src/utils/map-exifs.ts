export const mapExifs = (
  exifs:
    | Record<string, { value: string; clean?: string; raw?: string }>
    | undefined
): Record<string, string | number> => {
  if (!exifs) {
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
};
