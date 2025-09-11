import type {
  FindByUsernameResponse,
  GetPhotosQueryParams,
  GetPhotosResponse,
  PeopleFindByUsernameParams,
  PhotosGetExifParams,
  PhotosGetExifResponse,
  PhotosetsGetListParams,
  PhotosetsGetListResponse,
  PhotosetsGetPhotosParams,
  PhotosetsGetPhotosResponse,
} from "../types/flickr";
import ky from "ky";
import { BASE_URL, DEFAULT_OPTIONS } from "../constants";

interface API {
  "flickr.people.getPhotos": [GetPhotosQueryParams, GetPhotosResponse];
  "flickr.photosets.getPhotos": [
    PhotosetsGetPhotosParams,
    PhotosetsGetPhotosResponse,
  ];
  "flickr.photosets.getList": [
    PhotosetsGetListParams,
    PhotosetsGetListResponse,
  ];
  "flickr.people.findByUsername": [
    PeopleFindByUsernameParams,
    FindByUsernameResponse,
  ];
  "flickr.photos.getExif": [PhotosGetExifParams, PhotosGetExifResponse];
}

export interface Flickr {
  <T extends keyof API>(method: T, params: API[T][0]): Promise<API[T][1]>;
}

export function createFlickr(api_key: string) {
  return {
    flickr: <T extends keyof API>(
      method: T,
      params: API[T][0]
    ): Promise<API[T][1]> => {
      return ky(BASE_URL, {
        method: "get",
        headers: {
          "user-agent": "@lekoarts/flickr-loader",
        },
        timeout: 30000,
        searchParams: {
          api_key,
          format: "json",
          nojsoncallback: 1,
          extras: DEFAULT_OPTIONS.extras,
          per_page: DEFAULT_OPTIONS.per_page,
          method,
          ...params,
        },
      }).json();
    },
  };
}
