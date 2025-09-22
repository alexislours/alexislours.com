export interface PhotoImageUrl {
  height: number;
  width: number;
  orientation: "landscape" | "portrait" | "square";
  url: string;
}

export interface PhotoData {
  id: string;
  title: string;
  description?: string;
  date_taken: Date;
  longitude: number;
  latitude: number;
  imageUrls: {
    sq_75px?: PhotoImageUrl;
    "100px"?: PhotoImageUrl;
    sq_150px?: PhotoImageUrl;
    "240px"?: PhotoImageUrl;
    "320px"?: PhotoImageUrl;
    "500px"?: PhotoImageUrl;
    "640px"?: PhotoImageUrl;
    "800px"?: PhotoImageUrl;
    "1024px"?: PhotoImageUrl;
    "1600px"?: PhotoImageUrl;
    "2048px"?: PhotoImageUrl;
    original: PhotoImageUrl;
  };
  exif: {
    [key: string]: {
      value: string;
      clean?: string;
      raw?: string;
    };
  };
  locationName?: string;
}

export interface FlickrLoaderOptions {
  api_key?: string;
  username: string;
  photoset_id: string;
  mapbox_access_token?: string;
}

type FlickrSizeCode =
  | "o"
  | "sq"
  | "q"
  | "t"
  | "s"
  | "n"
  | "m"
  | "z"
  | "c"
  | "l"
  | "h"
  | "k";

interface FlickrPhotoBase {
  id: string;
  title: string | { _content: string };
  description?: { _content: string };
  datetaken?: string;
  latitude?: string;
  longitude?: string;
  secret: string;
  server: string;
  farm: number;
  orientation?: "landscape" | "portrait" | "square";
}

type FlickrPhotoUrls = {
  [K in FlickrSizeCode as `url_${K}`]?: string;
};

type FlickrPhotoDimensions = {
  [K in FlickrSizeCode as `width_${K}`]?: number;
} & {
  [K in FlickrSizeCode as `height_${K}`]?: number;
};

export type FlickrPhoto = FlickrPhotoBase &
  FlickrPhotoUrls &
  FlickrPhotoDimensions;

export interface FlickrPhotosetResponse extends FlickrApiResponse {
  photoset: {
    id: string;
    primary: string;
    owner: string;
    ownername: string;
    title: string;
    total: number;
    page: number;
    pages: number;
    perpage: number;
    photo: FlickrPhoto[];
  };
}

export interface FlickrExifResponse extends FlickrApiResponse {
  photo: {
    id: string;
    secret: string;
    server: string;
    farm: number;
    exif: Array<{
      tag: string;
      label: string;
      raw?: { _content: string };
      clean?: { _content: string };
    }>;
  };
}

export interface FlickrUserResponse extends FlickrApiResponse {
  user: {
    id: string;
    nsid: string;
    username: { _content: string };
  };
}

export interface MapboxReverseGeocodeResult {
  place_name: string;
  context: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface FlickrApiParams {
  [key: string]: string | number | boolean | undefined;
}

export interface FlickrApiResponse {
  stat: "ok" | "fail";
  code?: number;
  message?: string;
  [key: string]: unknown;
}
