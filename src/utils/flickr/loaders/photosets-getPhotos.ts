import type { Loader } from "astro/loaders";
import type { z } from "astro/zod";
import type { FlickrPhotosetsGetPhotosLoaderOptions } from "../types/loader";
import type {
  PhotosGetExifResponse,
  PhotosetsGetPhotosResponse,
} from "../types/flickr";
import { DEFAULT_OPTIONS } from "../constants";
import { PhotosetsGetPhotos } from "../schema";
import { missingApiKey } from "../utils/errors";
import { getUserIdFromUsername } from "../utils/get-user-id";
import { createFlickr } from "../utils/ky";
import { normalize } from "../utils/normalize";
import { paginate } from "../utils/paginate";
import {
  mapboxReverseGeocode,
  formatMapboxLocation,
} from "../../../utils/mapbox-reverse-geocode";

type Res = z.infer<typeof PhotosetsGetPhotos>;

/**
 * Transform EXIF data from array format to object format
 */
function transformExifData(exifArray: PhotosGetExifResponse["photo"]["exif"]) {
  const exifObject: Record<
    string,
    {
      value: string;
      clean?: string;
      raw?: string;
    }
  > = {};

  for (const exifEntry of exifArray) {
    const cleanValue = exifEntry.clean?._content;
    const rawValue = exifEntry.raw?._content;

    exifObject[exifEntry.tag] = {
      value: cleanValue || rawValue || "",
      ...(cleanValue && { clean: cleanValue }),
      ...(rawValue && { raw: rawValue }),
    };
  }

  return exifObject;
}

/**
 * Get the list of photos in a set.
 */
export function flickrPhotosetsGetPhotosLoader({
  api_key = import.meta.env.FLICKR_API_KEY,
  username,
  photoset_id,
  queryParams,
}: FlickrPhotosetsGetPhotosLoaderOptions): Loader {
  if (!api_key) {
    missingApiKey();
  }
  const { flickr } = createFlickr(api_key);

  return {
    name: "flickr-photosets-get-photos",
    load: async ({ logger, parseData, store, generateDigest }) => {
      logger.info(`Fetching photos from photoset ${photoset_id}`);
      let user_id: string;

      try {
        user_id = await getUserIdFromUsername(username, flickr);
      } catch (e) {
        logger.error("Failed to get user ID from username. Original error:");
        throw e;
      }

      function getPhotosetsPhotos(page: number) {
        return flickr("flickr.photosets.getPhotos", {
          user_id,
          photoset_id,
          per_page: DEFAULT_OPTIONS.per_page,
          page: page.toString(),
          extras: DEFAULT_OPTIONS.extras,
          ...queryParams,
        });
      }

      const result = await paginate(getPhotosetsPhotos);
      const flattenedPhotos = result.flatMap((r) => r.photoset.photo);

      const photoset = {
        id: result[0]!.photoset.id,
        primary: result[0]!.photoset.primary,
        owner: result[0]!.photoset.owner,
        ownername: result[0]!.photoset.ownername,
        title: result[0]!.photoset.title,
        total: result[0]!.photoset.total,
      };

      logger.info(
        `Fetching EXIF data and location names for ${flattenedPhotos.length} photos`
      );

      const fetchExifAndLocationForPhoto = async (
        photo: (typeof flattenedPhotos)[0]
      ) => {
        if (!photo.id) {
          return { photo, exifData: null, locationName: null };
        }

        const promises = [];

        // Fetch EXIF data
        const exifPromise = flickr("flickr.photos.getExif", {
          photo_id: photo.id,
          secret: photo.secret,
        })
          .then((exifResponse) => transformExifData(exifResponse.photo.exif))
          .catch((error) => {
            logger.warn(
              `Failed to fetch EXIF data for photo ${photo.id}: ${error}`
            );
            return null;
          });

        promises.push(exifPromise);

        // Fetch location name if coordinates are available
        let locationPromise: Promise<string | null> = Promise.resolve(null);
        if (
          photo.latitude &&
          photo.longitude &&
          photo.latitude !== "0" &&
          photo.longitude !== "0"
        ) {
          const mapboxAccessToken = import.meta.env.MAPBOX_ACCESS_TOKEN;
          if (mapboxAccessToken) {
            locationPromise = mapboxReverseGeocode(
              photo.latitude,
              photo.longitude,
              mapboxAccessToken
            )
              .then((result) => (result ? formatMapboxLocation(result) : null))
              .catch((error) => {
                logger.warn(
                  `Failed to fetch location name for photo ${photo.id}: ${error}`
                );
                return null;
              });
          }
        }

        promises.push(locationPromise);

        const [exifData, locationName] = await Promise.all(promises);

        return { photo, exifData, locationName };
      };

      const batchSize = 10;
      const photoResults = [];

      for (let i = 0; i < flattenedPhotos.length; i += batchSize) {
        const batch = flattenedPhotos.slice(i, i + batchSize);
        logger.info(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(flattenedPhotos.length / batchSize)} (${batch.length} photos)`
        );

        const batchResults = await Promise.all(
          batch.map(fetchExifAndLocationForPhoto)
        );
        photoResults.push(...batchResults);
      }

      for (const { photo, exifData, locationName } of photoResults) {
        if (!photo.id) {
          continue;
        }

        const normalized = normalize(photo);

        const photoData = {
          ...normalized,
          photoset,
          ...(exifData && { exif: exifData }),
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

      logger.info(
        `Loaded ${flattenedPhotos.length} photos from photoset ${photoset_id}`
      );
    },
    schema: PhotosetsGetPhotos,
  };
}
