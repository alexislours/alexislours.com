import type { Loader } from "astro/loaders";
import type { FlickrPeopleGetPhotosLoaderOptions } from "../types/loader";
import { DEFAULT_OPTIONS } from "../constants";
import { PeopleGetPhotos } from "../schema";
import { missingApiKey } from "../utils/errors";
import { getUserIdFromUsername } from "../utils/get-user-id";
import { createFlickr } from "../utils/ky";
import { normalize } from "../utils/normalize";
import { paginate } from "../utils/paginate";
import {
  mapboxReverseGeocode,
  formatMapboxLocation,
} from "../../mapbox-reverse-geocode";

/**
 * Return photos from the given user's photostream. Only photos visible to the calling user will be returned.
 */
export function flickrPeopleGetPhotosLoader({
  api_key = import.meta.env.FLICKR_API_KEY,
  username,
  queryParams,
}: FlickrPeopleGetPhotosLoaderOptions): Loader {
  if (!api_key) {
    missingApiKey();
  }
  const { flickr } = createFlickr(api_key);

  return {
    name: "flickr-people-get-photos",
    load: async ({ logger, parseData, store, generateDigest }) => {
      logger.info("Fetching photostream photos");
      let user_id: string;

      try {
        user_id = await getUserIdFromUsername(username, flickr);
      } catch (e) {
        logger.error("Failed to get user ID from username. Original error:");
        throw e;
      }

      function getPhotos(page: number) {
        return flickr("flickr.people.getPhotos", {
          user_id,
          per_page: DEFAULT_OPTIONS.per_page,
          page: page.toString(),
          extras: DEFAULT_OPTIONS.extras,
          ...queryParams,
        });
      }

      const result = await paginate(getPhotos);
      const flattenedResult = result.flatMap((r) => r.photos.photo);

      logger.info(
        `Fetching location names for ${flattenedResult.length} photos`
      );

      const fetchLocationForPhoto = async (
        photo: (typeof flattenedResult)[0]
      ) => {
        if (!photo.id) {
          return { photo, locationName: null };
        }

        // Fetch location name if coordinates are available
        let locationName: string | null = null;
        if (
          photo.latitude &&
          photo.longitude &&
          photo.latitude !== "0" &&
          photo.longitude !== "0"
        ) {
          const mapboxAccessToken = import.meta.env.MAPBOX_ACCESS_TOKEN;
          if (mapboxAccessToken) {
            try {
              const result = await mapboxReverseGeocode(
                photo.latitude,
                photo.longitude,
                mapboxAccessToken
              );
              locationName = result ? formatMapboxLocation(result) : null;
            } catch (error) {
              logger.warn(
                `Failed to fetch location name for photo ${photo.id}: ${error}`
              );
            }
          }
        }

        return { photo, locationName };
      };

      const batchSize = 10;
      const photoResults = [];

      for (let i = 0; i < flattenedResult.length; i += batchSize) {
        const batch = flattenedResult.slice(i, i + batchSize);
        logger.info(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(flattenedResult.length / batchSize)} (${batch.length} photos)`
        );

        const batchResults = await Promise.all(
          batch.map(fetchLocationForPhoto)
        );
        photoResults.push(...batchResults);
      }

      for (const { photo, locationName } of photoResults) {
        if (!photo.id) {
          continue;
        }

        const normalized = normalize(photo);
        const photoData = {
          ...normalized,
          ...(locationName && { locationName }),
        };

        const data = await parseData({ id: normalized.id, data: photoData });
        const digest = generateDigest(data);

        store.set({
          id: normalized.id,
          data,
          digest,
        });
      }

      logger.info(`Loaded ${flattenedResult.length} photos`);
    },
    schema: PeopleGetPhotos,
  };
}
