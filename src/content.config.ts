import { defineCollection } from "astro:content";
import { createPhotoLoader } from "@utils/photo-loader";

const photos = defineCollection({
  loader: createPhotoLoader({
    username: "alexislours",
    photoset_id: "72177720327384119",
  }),
});

export const collections = {
  photos,
};
