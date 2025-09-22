import { BASE_URL, DEFAULT_OPTIONS, API_CONFIG } from "./constants";
import type {
  FlickrApiParams,
  FlickrApiResponse,
  FlickrExifResponse,
  FlickrPhoto,
  FlickrPhotosetResponse,
  FlickrUserResponse,
} from "./types";

/**
 * Makes a request to the Flickr API with the specified method and parameters
 * @param api_key - The Flickr API key
 * @param method - The Flickr API method to call
 * @param params - Additional parameters for the API request
 * @returns Promise resolving to the API response
 * @throws Error when the API request fails
 */
export async function makeFlickrRequest<
  T extends FlickrApiResponse = FlickrApiResponse,
>(api_key: string, method: string, params: FlickrApiParams): Promise<T> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", api_key);
  url.searchParams.set("format", "json");
  url.searchParams.set("nojsoncallback", "1");
  url.searchParams.set("method", method);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          "user-agent": "photo-loader",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Flickr API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.stat === "fail") {
        throw new Error(
          `Flickr API returned error: ${data.message || "Unknown error"} (code: ${data.code || "unknown"})`
        );
      }

      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < API_CONFIG.MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt)
        );
      }
    }
  }

  throw new Error(
    `Failed to fetch from Flickr API after ${API_CONFIG.MAX_RETRIES} attempts: ${lastError.message}`
  );
}

/**
 * Gets a user's NSID (user ID) from their username
 * @param api_key - The Flickr API key
 * @param username - The username to look up
 * @returns Promise resolving to the user's NSID
 * @throws Error when the user cannot be found
 */
export async function getUserIdFromUsername(
  api_key: string,
  username: string
): Promise<string> {
  const response = await makeFlickrRequest<FlickrUserResponse>(
    api_key,
    "flickr.people.findByUsername",
    {
      username,
    }
  );
  return response.user.nsid;
}

/**
 * Gets photos from a specific photoset with pagination
 * @param api_key - The Flickr API key
 * @param user_id - The owner's user ID
 * @param photoset_id - The photoset ID to fetch photos from
 * @param page - The page number to fetch (default: 1)
 * @returns Promise resolving to the photoset response
 */
export async function getPhotosetPhotos(
  api_key: string,
  user_id: string,
  photoset_id: string,
  page: number = 1
): Promise<FlickrPhotosetResponse> {
  return makeFlickrRequest<FlickrPhotosetResponse>(
    api_key,
    "flickr.photosets.getPhotos",
    {
      user_id,
      photoset_id,
      per_page: DEFAULT_OPTIONS.per_page,
      page: page.toString(),
      extras: DEFAULT_OPTIONS.extras,
    }
  );
}

/**
 * Fetches all photos from a photoset by paginating through all pages
 * @param api_key - The Flickr API key
 * @param user_id - The owner's user ID
 * @param photoset_id - The photoset ID to fetch photos from
 * @returns Promise resolving to an array of all photos in the photoset
 */
export async function paginatePhotos(
  api_key: string,
  user_id: string,
  photoset_id: string
): Promise<FlickrPhoto[]> {
  const allPhotos: FlickrPhoto[] = [];
  let page = 1;
  let pages = 1;

  do {
    const response = await getPhotosetPhotos(
      api_key,
      user_id,
      photoset_id,
      page
    );
    allPhotos.push(...response.photoset.photo);
    pages = response.photoset.pages;
    page++;
  } while (page <= pages);

  return allPhotos;
}

/**
 * Gets EXIF data for a specific photo
 * @param api_key - The Flickr API key
 * @param photo_id - The photo ID
 * @param secret - The photo's secret
 * @returns Promise resolving to EXIF data object or null if unavailable
 */
export async function getPhotoExif(
  api_key: string,
  photo_id: string,
  secret: string
): Promise<Record<
  string,
  { value: string; clean?: string; raw?: string }
> | null> {
  try {
    const response = await makeFlickrRequest<FlickrExifResponse>(
      api_key,
      "flickr.photos.getExif",
      {
        photo_id,
        secret,
      }
    );

    const exifObject: Record<
      string,
      { value: string; clean?: string; raw?: string }
    > = {};

    for (const exifEntry of response.photo.exif) {
      const cleanValue = exifEntry.clean?._content;
      const rawValue = exifEntry.raw?._content;

      exifObject[exifEntry.tag] = {
        value: cleanValue || rawValue || "",
        ...(cleanValue && { clean: cleanValue }),
        ...(rawValue && { raw: rawValue }),
      };
    }

    return exifObject;
  } catch (error) {
    console.warn(`Failed to fetch EXIF data for photo ${photo_id}:`, error);
    return null;
  }
}
