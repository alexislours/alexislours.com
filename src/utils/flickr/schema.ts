import { z } from "astro/zod";

const PhotoMeta = z.object({
  height: z.number(),
  width: z.number(),
  orientation: z.enum(["landscape", "portrait", "square"]),
  url: z.string(),
});

const imageUrls = z.object({
  sq_75px: PhotoMeta.optional(),
  "100px": PhotoMeta.optional(),
  sq_150px: PhotoMeta.optional(),
  "240px": PhotoMeta.optional(),
  "320px": PhotoMeta.optional(),
  "500px": PhotoMeta.optional(),
  "640px": PhotoMeta.optional(),
  "800px": PhotoMeta.optional(),
  "1024px": PhotoMeta.optional(),
  "1600px": PhotoMeta.optional(),
  "2048px": PhotoMeta.optional(),
  original: PhotoMeta.optional(),
});

const AlwaysAvailable = z.object({
  id: z.string(),
});

const ExifData = z.record(
  z.string(),
  z.object({
    value: z.string(),
    clean: z.string().optional(),
    raw: z.string().optional(),
  })
);

const NormalizedPhoto = AlwaysAvailable.extend({
  title: z.string(),
  is_public: z.boolean(),
  is_friend: z.boolean(),
  is_family: z.boolean(),
  description: z.string().optional(),
  date_last_update: z.date().optional(),
  date_taken: z.date().optional(),
  views: z.number().optional(),
  media: z.string().optional(),
  media_status: z.string().optional(),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrls,
  exif: ExifData.optional(),
  locationName: z.string().optional(),
});

export const PeopleGetPhotos = NormalizedPhoto.extend({
  owner: z.string(),
});

export const PhotosetsGetList = AlwaysAvailable.extend({
  owner: z.string(),
  title: z.string(),
  description: z.string().optional(),
  username: z.string(),
  primary: z.string(),
  views: z.number().optional(),
  comments: z.number().optional(),
  photos: z.number().optional(),
  videos: z.number().optional(),
  date_create: z.date().optional(),
  date_last_update: z.date().optional(),
});

export const PhotosetsGetPhotos = NormalizedPhoto.extend({
  photoset: z.object({
    id: z.string(),
    primary: z.string(),
    owner: z.string(),
    ownername: z.string(),
    title: z.string(),
    total: z.number(),
  }),
});

export const PhotosetsGetListWithPhotos = PhotosetsGetList.extend({
  photos: z.array(NormalizedPhoto),
});
