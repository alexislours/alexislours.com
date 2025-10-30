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

const photos2025 = defineCollection({
  loader: createPhotoLoader({
    username: "alexislours",
    photoset_id: "72177720329990561",
  }),
});

export const collections = {
  photos,
  otherPictures,
  photos2025,
};
