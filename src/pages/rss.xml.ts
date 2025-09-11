import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const allPhotos = await getCollection("photos");
  const sortedPhotos = allPhotos.sort(
    (a, b) =>
      new Date(b.data.date_taken as Date).getTime() -
      new Date(a.data.date_taken as Date).getTime()
  );

  const site = context.site ?? "https://alexislours.com";

  return rss({
    title: "Alexis LOURS",
    description: "Feed of the latest photos.",
    site,
    items: sortedPhotos.map((photo) => {
      const {
        url: imageUrl,
        width: imageWidth,
        height: imageHeight,
      } = photo.data.imageUrls.original ?? {};
      const fullImageUrl = imageUrl
        ? new URL(imageUrl, site).toString()
        : undefined;
      const plainDescription =
        photo.data.description || photo.data.title || `Photo ${photo.id}`;
      const photoUrl = new URL(`/photo/${photo.id}/`, site).toString();

      const htmlContent = imageUrl
        ? `<div>
        <img src="${fullImageUrl}" alt="${photo.data.description || photo.data.title || "Photo"}" width="${imageWidth || ""}" height="${imageHeight || ""}" style="max-width: 100%; height: auto;" />
        ${photo.data.description ? `<p>${photo.data.description}</p>` : ""}
        <p><a href="${photoUrl}">View full photo</a></p>
      </div>`
        : plainDescription;

      return {
        title: photo.data.title || `Photo ${photo.id}`,
        description: plainDescription,
        pubDate: new Date(photo.data.date_taken as Date),
        link: `/photo/${photo.id}`,
        guid: photo.id,
        content: htmlContent,
        ...(fullImageUrl && {
          customData: `<enclosure url="${fullImageUrl}" type="image/jpeg" length="0" />`,
        }),
      };
    }),
  });
}
