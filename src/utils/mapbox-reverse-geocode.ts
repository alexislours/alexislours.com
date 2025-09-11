export interface MapboxReverseGeocodeResult {
  place_name: string;
  context: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export async function mapboxReverseGeocode(
  latitude: string,
  longitude: string,
  accessToken: string
): Promise<MapboxReverseGeocodeResult | null> {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${accessToken}&types=address,poi,place`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `Mapbox reverse geocoding failed for ${latitude}, ${longitude}`
      );
      return null;
    }

    const data = await response.json();
    return data.features[0] || null;
  } catch (error) {
    console.error("Mapbox reverse geocoding error:", error);
    return null;
  }
}

export function formatMapboxLocation(
  result: MapboxReverseGeocodeResult
): string {
  const context = result.context || [];
  const place = context.find((c) => c.id.includes("place"));
  const region = context.find((c) => c.id.includes("region"));
  const country = context.find((c) => c.id.includes("country"));

  const parts = [];
  if (place) parts.push(place.text);
  if (region) parts.push(region.text);
  if (country) parts.push(country.text);

  return parts.join(", ") || result.place_name;
}
