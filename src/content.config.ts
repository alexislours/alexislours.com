import { defineCollection } from "astro:content";
import { createPhotoLoader } from "@utils/photo-loader";

const photos = defineCollection({
  loader: createPhotoLoader({
    username: "alexislours",
    photoset_id: "72177720327384119",
  }),
});

const photoShowcase = defineCollection({
  loader: createPhotoLoader({
    username: "alexislours",
    photoset_id: "72177720329990561",
  }),
});

const analog = defineCollection({
  loader: createPhotoLoader({
    username: "alexisloursphotos",
    photoset_id: "72177720331367024",
  }),
});

export const collections = {
  photos,
  photoShowcase,
  analog,
};
