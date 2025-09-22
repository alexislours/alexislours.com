import type { Loader } from "astro/loaders";
import { getUserIdFromUsername, paginatePhotos, getPhotoExif } from "./api";
import { API_CONFIG } from "./constants";
import { formatMapboxLocation, mapboxReverseGeocode } from "./geocoding";
import { normalizePhoto } from "./normalizer";
import { PhotoSchema } from "./schema";
import type { FlickrLoaderOptions } from "./types";

/**
 * Creates an Astro loader that fetches photos from a Flickr photoset
 *
 * This loader will:
 * - Fetch all photos from the specified Flickr photoset
 * - Retrieve EXIF data for each photo
 * - Perform reverse geocoding to get location names (if Mapbox token provided)
 * - Process and normalize photo data into a consistent format
 * - Store the data for use by Astro's content collections
 *
 * @param options - Configuration options for the photo loader
 * @param options.api_key - Flickr API key (defaults to FLICKR_API_KEY env var)
 * @param options.username - Flickr username that owns the photoset
 * @param options.photoset_id - ID of the Flickr photoset to load photos from
 * @param options.mapbox_access_token - Mapbox access token for reverse geocoding (defaults to MAPBOX_ACCESS_TOKEN env var)
 * @returns An Astro loader instance configured for the specified photoset
 * @throws Error when required API key is missing
 *
 * @example
 * ```ts
 * // In content.config.ts
 * import { createPhotoLoader } from './utils/photo-loader';
 *
 * export const collections = {
 *   photos: defineCollection({
 *     loader: createPhotoLoader({
 *       username: 'your-username',
 *       photoset_id: '72177720123456789',
 *     }),
 *   }),
 * };
 * ```
 */
export function createPhotoLoader(options: FlickrLoaderOptions): Loader {
  const {
    api_key = import.meta.env.FLICKR_API_KEY,
    username,
    photoset_id,
    mapbox_access_token = import.meta.env.MAPBOX_ACCESS_TOKEN,
  } = options;

  if (!api_key) {
    throw new Error(
      "Flickr API key is required. Set FLICKR_API_KEY environment variable or pass api_key option."
    );
  }

  return {
    name: "photo-loader",
    load: async ({ logger, parseData, store, generateDigest }) => {
      logger.info(`Fetching photos from photoset ${photoset_id}`);

      try {
        const user_id = await getUserIdFromUsername(api_key, username);
        logger.info(`Found user ID: ${user_id}`);

        const photos = await paginatePhotos(api_key, user_id, photoset_id);
        logger.info(`Found ${photos.length} photos in photoset`);

        for (let i = 0; i < photos.length; i += API_CONFIG.BATCH_SIZE) {
          const batch = photos.slice(i, i + API_CONFIG.BATCH_SIZE);
          logger.info(
            `Processing batch ${Math.floor(i / API_CONFIG.BATCH_SIZE) + 1}/${Math.ceil(
              photos.length / API_CONFIG.BATCH_SIZE
            )} (${batch.length} photos)`
          );

          await Promise.all(
            batch.map(async (photo) => {
              try {
                const normalizedPhoto = normalizePhoto(photo);

                const [exifData, locationResult] = await Promise.all([
                  getPhotoExif(api_key, photo.id, photo.secret),
                  normalizedPhoto.latitude &&
                  normalizedPhoto.longitude &&
                  normalizedPhoto.latitude !== 0 &&
                  normalizedPhoto.longitude !== 0 &&
                  mapbox_access_token
                    ? mapboxReverseGeocode(
                        String(normalizedPhoto.latitude),
                        String(normalizedPhoto.longitude),
                        mapbox_access_token
                      )
                    : Promise.resolve(null),
                ]);

                if (exifData) {
                  normalizedPhoto.exif = exifData;
                }

                if (locationResult) {
                  normalizedPhoto.locationName =
                    formatMapboxLocation(locationResult);
                }

                const data = await parseData({
                  id: normalizedPhoto.id,
                  data: normalizedPhoto as unknown as Record<string, unknown>,
                });
                const digest = generateDigest(data);

                store.set({
                  id: normalizedPhoto.id,
                  data,
                  digest,
                });
              } catch (error) {
                logger.error(`Failed to process photo ${photo.id}: ${error}`);
                throw error;
              }
            })
          );
        }

        logger.info(
          `Successfully loaded ${photos.length} photos from photoset ${photoset_id}`
        );
      } catch (error) {
        logger.error(`Failed to load photos: ${error}`);
        throw error;
      }
    },
    schema: PhotoSchema,
  };
}

export type {
  FlickrExifResponse,
  FlickrLoaderOptions,
  FlickrPhoto,
  FlickrPhotosetResponse,
  FlickrUserResponse,
  MapboxReverseGeocodeResult,
  PhotoData,
  PhotoImageUrl,
} from "./types";
