import { z } from "astro/zod";

export const PhotoMeta = z.object({
  height: z.number(),
  width: z.number(),
  orientation: z.enum(["landscape", "portrait", "square"]),
  url: z.string(),
});

export const PhotoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date_taken: z.date(),
  longitude: z.number(),
  latitude: z.number(),
  imageUrls: z.object({
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
    original: PhotoMeta,
  }),
  exif: z.record(
    z.string(),
    z.object({
      value: z.string(),
      clean: z.string().optional(),
      raw: z.string().optional(),
    })
  ),
  locationName: z.string().optional(),
});
