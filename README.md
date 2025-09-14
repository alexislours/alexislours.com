# alexislours.com

My photography portfolio built with Astro, Svelte and TailwindCSS.

## License

This project's code is under the
[MIT](https://choosealicense.com/licenses/mit/) license.

All the photos found on the [site](https://alexislours.com) are available under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Features

- **Photo Gallery**: Grid layout displaying photography with image optimization
- **Flickr Integration**: Loads images and EXIF data from Flickr
- **Photo Map**: Mapbox map showing photo locations with markers
- **Search**: Full-text search using Pagefind with image previews
- **RSS Feed**: XML feed for photo updates
- **JSON API**: API endpoints for accessing photo data
- **Responsive Design**: Mobile-first layout
- **Optimizations**: Optimized images, perfect Lighthouse score
- **Minimal JavaScript**: JavaScript only used for the map page, optional everywhere else
- **SEO**: Structured data, meta tags, and sitemap generation
- **Social Links**: LinkTree style page
- **Accessibility**: Keyboard navigation and semantic HTML

## Environment Variables

To run this project, you will need to create a `.env` file in the root directory and add the following environment variables to it:

- `FLICKR_API_KEY`, a Flickr API key, used to retrieve the pictures.
- `MAPBOX_ACCESS_TOKEN`, a Mapbox access token with access to the `Static Images API` and `Temporary Geocoding API`, used to generate the map preview found in the picture pages and the reverse geocoding informations.
- `MAPBOX_PUBLIC_ACCESS_TOKEN`, a Mapbox public access token, used for the `/map/` page.

Additionally, the [content.config.ts](src/content.config.ts) file should be updated to fetch data from another Flickr album.

## Installation

After cloning the project, you only need to install the dependencies using:

```bash
npm install
```

## Building

The project can be built using the following command:

```bash
npm run build
```

The build step can be long due to:

- Astro generating responsive AVIF variants of all images
- Having to make multiple calls to the Flickr API to retrieve EXIFs
- Having to make multiple calls to the Mapbox API to retrieve reverse geocoding data.

After the first build and the images cached, an incremental build takes around 30s for ~250 pictures.

## API Reference

The project provides a read only JSON API to retrieve photo data.

Each photo is returned as an object of this format:

```json
{
  "id": "54782096887",
  "title": "Common Moorhen",
  "description": "Portrait of a common moorhen (Gallinula chloropus).",
  "date_taken": "2025-09-12T13:08:44.000Z",
  "imageUrls": {
    "sq_75px": {
      "height": 75,
      "width": 75,
      "orientation": "square",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_s.jpg"
    },
    "100px": {
      "height": 67,
      "width": 100,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_t.jpg"
    },
    "sq_150px": {
      "height": 150,
      "width": 150,
      "orientation": "square",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_q.jpg"
    },
    "240px": {
      "height": 160,
      "width": 240,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_m.jpg"
    },
    "320px": {
      "height": 213,
      "width": 320,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_n.jpg"
    },
    "500px": {
      "height": 333,
      "width": 500,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618.jpg"
    },
    "640px": {
      "height": 427,
      "width": 640,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_z.jpg"
    },
    "800px": {
      "height": 533,
      "width": 800,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_c.jpg"
    },
    "1024px": {
      "height": 683,
      "width": 1024,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_9da26f1618_b.jpg"
    },
    "1600px": {
      "height": 1067,
      "width": 1600,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_34d8599109_h.jpg"
    },
    "2048px": {
      "height": 1365,
      "width": 2048,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_d8f12c371f_k.jpg"
    },
    "original": {
      "height": 4640,
      "width": 6960,
      "orientation": "landscape",
      "url": "https://live.staticflickr.com/65535/54782096887_622b6ef4b3_o.jpg"
    }
  },
  "exifs": {
    "model": "Canon EOS R7",
    "lens": "RF200-800mm F6.3-9 IS USM",
    "exposureTime": "1/2500",
    "fNumber": "f/8.0",
    "focalLength": "600 mm",
    "iso": "4000"
  },
  "location": {
    "latitude": 48.934882,
    "longitude": 2.314252,
    "locationName": "Gennevilliers, Hauts-de-Seine, France"
  }
}
```

#### Get all photos

Returns an array of all photo objects.

```http
GET /api/photos/all
```

#### Get a photo by ID

Returns a single photo from its ID.

```http
GET /api/photos/${id}
```