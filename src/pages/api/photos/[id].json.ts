import { getCollection } from "astro:content";
import { mapExifs } from "../../../utils/map-exifs";

export async function getStaticPaths() {
  const allPhotos = await getCollection("photos");
  return allPhotos.map((photo) => ({
    params: { id: photo.id },
  }));
}

export async function GET({ params }: { params: { id: string } }) {
  const allPhotos = await getCollection("photos");
  const photo = allPhotos.find((p) => p.id === params.id);

  if (!photo) {
    return new Response(JSON.stringify({ error: "Photo not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const photoData = {
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
  };

  return new Response(JSON.stringify(photoData), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
