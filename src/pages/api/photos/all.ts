import { getCollection } from "astro:content";
import { mapExifs } from "@utils/exif";

export async function GET() {
  const allPhotos = await getCollection("photos");
  const sortedPhotos = allPhotos.sort(
    (a, b) =>
      new Date(b.data.date_taken as Date).getTime() -
      new Date(a.data.date_taken as Date).getTime()
  );

  const photos = sortedPhotos.map((photo) => ({
    id: photo.id,
    title: photo.data.title,
    description: photo.data.description,
    date_taken: photo.data.date_taken,
    imageUrls: photo.data.imageUrls,
    exifs: mapExifs(photo.data.exif),
    location: {
      latitude: photo.data.latitude ? +photo.data.latitude : undefined,
      longitude: photo.data.longitude ? +photo.data.longitude : undefined,
      locationName: (photo.data as { locationName?: string }).locationName,
    },
  }));

  return new Response(JSON.stringify(photos), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
