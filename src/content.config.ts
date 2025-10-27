import { defineCollection } from "astro:content";
import { createPhotoLoader } from "@utils/photo-loader";

const photos = defineCollection({
  loader: createPhotoLoader({
    username: "alexislours",
    photoset_id: "72177720327384119",
  }),
});

const otherPictures = defineCollection({
  loader: createPhotoLoader({
    username: "alexisloursphotos",
    photoset_id: "72177720329950379",
  }),
});

export const collections = {
  photos,
  otherPictures,
};
