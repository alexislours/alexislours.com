import { flickrPhotosetsGetPhotosLoader } from "./utils/flickr";
import { defineCollection } from "astro:content";

const photos = defineCollection({
  loader: flickrPhotosetsGetPhotosLoader({
    username: "alexislours",
    photoset_id: "72177720327384119",
  }),
});

export const collections = {
  photos,
};
