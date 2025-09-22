import type { MapboxReverseGeocodeResult } from "./types";

/**
 * Performs reverse geocoding using Mapbox API to get location name from coordinates
 * @param latitude - The latitude coordinate as a string
 * @param longitude - The longitude coordinate as a string
 * @param accessToken - The Mapbox access token
 * @returns Promise resolving to the geocoding result or null if unavailable
 */
export async function mapboxReverseGeocode(
  latitude: string,
  longitude: string,
  accessToken: string
): Promise<MapboxReverseGeocodeResult | null> {
  if (!latitude || !longitude || !accessToken) {
    return null;
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    return null;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&types=address,poi,place`;

    const response = await fetch(url, {
      headers: {
        "user-agent": "photo-loader",
      },
    });

    if (!response.ok) {
      console.warn(
        `Mapbox reverse geocoding failed for ${lat}, ${lng}: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return data.features[0];
  } catch (error) {
    console.error(`Mapbox reverse geocoding error for ${lat}, ${lng}:`, error);
    return null;
  }
}

/**
 * Formats a Mapbox reverse geocoding result into a readable location string
 * @param result - The Mapbox reverse geocoding result
 * @returns A formatted location string with place, region, and country
 */
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
