import type { Loader } from "astro/loaders";
import type { FlickrPhotosetsGetListWithPhotosLoaderOptions } from "../types/loader";
import { DEFAULT_OPTIONS } from "../constants";
import { PhotosetsGetListWithPhotos } from "../schema";
import { missingApiKey } from "../utils/errors";
import { getUserIdFromUsername } from "../utils/get-user-id";
import { createFlickr } from "../utils/ky";
import { normalize } from "../utils/normalize";
import { paginate } from "../utils/paginate";

/**
 * Returns the photosets belonging to the specified user.
 */
export function flickrPhotosetsGetListWithPhotosLoader({
  api_key = import.meta.env.FLICKR_API_KEY,
  username,
  queryParams,
  in: _in,
  nin: _nin,
}: FlickrPhotosetsGetListWithPhotosLoaderOptions): Loader {
  if (!api_key) {
    missingApiKey();
  }
  const { flickr } = createFlickr(api_key);

  return {
    name: "flickr-photosets-get-list-with-photos",
    load: async ({ logger, parseData, store, generateDigest }) => {
      logger.info("Fetching photosets list");
      let user_id: string;

      try {
        user_id = await getUserIdFromUsername(username, flickr);
      } catch (e) {
        logger.error("Failed to get user ID from username. Original error:");
        throw e;
      }

      function getPhotosetsList(page: number) {
        return flickr("flickr.photosets.getList", {
          user_id,
          per_page: DEFAULT_OPTIONS.per_page,
          page: page.toString(),
          ...queryParams,
        });
      }

      const result = await paginate(getPhotosetsList);
      const flattenedResult = result.flatMap((r) => r.photosets.photoset);

      logger.info(`Loaded ${flattenedResult.length} photosets`);

      let photosetCounter = 0;

      for (const result of flattenedResult) {
        if (!result.id) {
          continue;
        }

        if (_in && !_in.includes(result.id)) {
          continue;
        }
        if (_nin && _nin.includes(result.id)) {
          continue;
        }

        const normalizedPhotoset = normalize(result);

        function getPhotosetsPhotos(page: number) {
          return flickr("flickr.photosets.getPhotos", {
            user_id,
            photoset_id: normalizedPhotoset.id,
            per_page: DEFAULT_OPTIONS.per_page,
            page: page.toString(),
            extras: DEFAULT_OPTIONS.extras,
            ...queryParams,
          });
        }

        const photosResult = await paginate(getPhotosetsPhotos);
        const flattenedPhotosResult = photosResult.flatMap(
          (r) => r.photoset.photo
        );
        const photos = flattenedPhotosResult.map(normalize);

        const data = await parseData({
          id: normalizedPhotoset.id,
          data: {
            ...normalizedPhotoset,
            photos,
          },
        });
        const digest = generateDigest(data);

        store.set({
          id: normalizedPhotoset.id,
          data,
          digest,
        });

        photosetCounter++;
      }

      logger.info(`Processed ${photosetCounter} photosets`);
    },
    schema: PhotosetsGetListWithPhotos,
  };
}
