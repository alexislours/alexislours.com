<script lang="ts">
  import { onMount } from "svelte";
  import mapboxgl from "mapbox-gl";
  import "mapbox-gl/dist/mapbox-gl.css";

  interface Photo {
    id: string;
    title: string;
    description: string;
    date_taken: Date;
    url_o: string;
    url_500: string;
    width_o: number;
    height_o: number;
    latitude: number;
    longitude: number;
    locationName?: string;
  }

  export let photos: Photo[] = [];
  export let mapboxToken: string;

  let mapContainer: HTMLDivElement;
  let map: mapboxgl.Map;
  let currentMapStyle = "outdoors";
  let showHeatmap = false;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const switchMapStyle = (style: string) => {
    currentMapStyle = style;
    const styleUrl =
      style === "satellite"
        ? "mapbox://styles/mapbox/satellite-v9"
        : "mapbox://styles/mapbox/outdoors-v12";
    map.setStyle(styleUrl);

    map.once("styledata", () => {
      addPhotoData();
    });
  };

  const setLayerVisibility = (
    layerId: string,
    visibility: "visible" | "none"
  ) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visibility);
    }
  };

  const showHeatmapLayers = () => {
    setLayerVisibility("photos-markers", "none");
    setLayerVisibility("photos-icons", "none");
    setLayerVisibility("clusters", "none");
    setLayerVisibility("cluster-count", "none");
    setLayerVisibility("photos-heatmap-layer", "visible");
  };

  const showMarkerLayers = () => {
    setLayerVisibility("photos-heatmap-layer", "none");
    setLayerVisibility("photos-markers", "visible");
    setLayerVisibility("photos-icons", "visible");
    setLayerVisibility("clusters", "visible");
    setLayerVisibility("cluster-count", "visible");
  };

  const toggleHeatmap = () => {
    showHeatmap = !showHeatmap;
    if (showHeatmap) {
      showHeatmapLayers();
    } else {
      showMarkerLayers();
    }
  };

  const eventHandlers: { [key: string]: any } = {};

  const removeAllEventHandlers = () => {
    Object.entries(eventHandlers).forEach(([key, handler]) => {
      const [event, layer] = key.split(":");
      map.off(event as any, layer, handler);
    });
    Object.keys(eventHandlers).forEach((key) => delete eventHandlers[key]);
  };

  const addPhotoData = () => {
    removeAllEventHandlers();

    const geojsonData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection" as const,
      features: photos.map((photo) => ({
        type: "Feature" as const,
        properties: {
          id: photo.id,
          title: photo.title,
          description: photo.description,
          date_taken: photo.date_taken.toISOString(),
          url_o: photo.url_o,
          url_500: photo.url_500,
          locationName: photo.locationName || "",
        },
        geometry: {
          type: "Point" as const,
          coordinates: [photo.longitude, photo.latitude],
        },
      })),
    };

    if (!map.getSource("photos-clustered")) {
      map.addSource("photos-clustered", {
        type: "geojson",
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });
    } else {
      const source = map.getSource(
        "photos-clustered"
      ) as mapboxgl.GeoJSONSource;
      source.setData(geojsonData);
    }

    if (!map.getSource("photos-heatmap")) {
      map.addSource("photos-heatmap", {
        type: "geojson",
        data: geojsonData,
      });
    } else {
      const source = map.getSource("photos-heatmap") as mapboxgl.GeoJSONSource;
      source.setData(geojsonData);
    }

    if (!map.getLayer("photos-heatmap-layer")) {
      map.addLayer({
        id: "photos-heatmap-layer",
        type: "heatmap",
        source: "photos-heatmap",
        layout: {
          visibility: "none",
        },
        paint: {
          "heatmap-weight": 0.8,
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1,
            10,
            2,
            15,
            3,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.05,
            "rgba(0,0,255,0.3)",
            0.2,
            "rgba(0,100,255,0.4)",
            0.4,
            "rgba(0,200,255,0.5)",
            0.6,
            "rgba(0,255,255,0.6)",
            0.8,
            "rgba(100,255,100,0.7)",
            0.9,
            "rgba(255,255,0,0.8)",
            0.97,
            "rgba(255,150,0,0.9)",
            0.99,
            "rgba(255,50,0,0.95)",
            1,
            "rgba(255,0,0,1)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            15,
            10,
            25,
            15,
            35,
          ],
          "heatmap-opacity": 0.8,
        },
      });
    }

    if (!map.getLayer("clusters")) {
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "photos-clustered",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#51bbd6",
            10,
            "#f1f075",
            30,
            "#f28cb1",
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 30, 30, 40],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }

    if (!map.getLayer("cluster-count")) {
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "photos-clustered",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });
    }

    if (!map.getLayer("photos-markers")) {
      map.addLayer({
        id: "photos-markers",
        type: "circle",
        source: "photos-clustered",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#ff5555",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }

    if (!map.getLayer("photos-icons")) {
      map.addLayer({
        id: "photos-icons",
        type: "symbol",
        source: "photos-clustered",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": "📷",
          "text-font": ["Open Sans Regular"],
          "text-size": 12,
        },
      });
    }

    eventHandlers["click:clusters"] = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (features && features.length > 0 && features[0].properties) {
        const clusterId = features[0].properties.cluster_id;
        const source = map.getSource(
          "photos-clustered"
        ) as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err: any, zoom: any) => {
          if (!err && features[0].geometry.type === "Point") {
            map.easeTo({
              center: features[0].geometry.coordinates as [number, number],
              zoom: zoom,
            });
          }
        });
      }
    };

    eventHandlers["click:photos-markers"] = (e: any) => {
      if (
        e.features &&
        e.features.length > 0 &&
        e.features[0].geometry.type === "Point"
      ) {
        const coordinates = e.features[0].geometry.coordinates.slice() as [
          number,
          number,
        ];
        const properties = e.features[0].properties;

        if (!properties) return;

        const maxWidth = 280;
        const imageHeight = 180;

        const popupHTML = `
          <div class="p-0 max-w-[${maxWidth}px]">
            <div class="relative">
              <img 
                src="${properties.url_500}" 
                alt="${properties.description || properties.title}"
                class="w-full h-[${imageHeight}px] object-cover rounded-t-lg"
                loading="lazy"
              />
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-2 leading-tight text-sm">${properties.title}</h3>
              ${properties.description ? `<p class="text-gray-600 text-xs mb-2 line-clamp-2">${properties.description}</p>` : ""}
              <div class="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <span>📅</span>
                <span>${formatDate(new Date(properties.date_taken))}</span>
              </div>
              ${
                properties.locationName
                  ? `
                <div class="text-xs text-gray-500 mb-3 flex items-start gap-1">
                  <span>📍</span>
                  <span class="break-words">${properties.locationName}</span>
                </div>
              `
                  : ""
              }
              <a 
                href="/photo/${properties.id}/"
                class="inline-block bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded transition-colors duration-200 w-full text-center"
              >
                View Full Photo
              </a>
            </div>
          </div>
        `;

        new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: true,
          maxWidth: `${maxWidth}px`,
        })
          .setLngLat(coordinates)
          .setHTML(popupHTML)
          .addTo(map);
      }
    };

    eventHandlers["mouseenter:clusters"] = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    eventHandlers["mouseleave:clusters"] = () => {
      map.getCanvas().style.cursor = "";
    };
    eventHandlers["mouseenter:photos-markers"] = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    eventHandlers["mouseleave:photos-markers"] = () => {
      map.getCanvas().style.cursor = "";
    };

    Object.entries(eventHandlers).forEach(([key, handler]) => {
      const [event, layer] = key.split(":");
      map.on(event as any, layer, handler);
    });

    if (showHeatmap) {
      showHeatmapLayers();
    } else {
      showMarkerLayers();
    }
  };

  onMount(() => {
    if (!mapboxToken) {
      console.error("Mapbox token is not provided");
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map = new mapboxgl.Map({
      container: mapContainer,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [0, 20],
      zoom: 1,
      maxZoom: 18,
    });

    map.on("load", () => {
      addPhotoData();

      if (photos.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        photos.forEach((photo) => {
          bounds.extend([photo.longitude, photo.latitude]);
        });

        setTimeout(() => {
          map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
          });
        }, 100);
      }

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    });

    return () => {
      if (map) {
        removeAllEventHandlers();
        map.remove();
      }
    };
  });
</script>

<div class="relative h-full w-full">
  <div
    bind:this={mapContainer}
    class="h-full w-full">
  </div>

  <div class="absolute top-4 left-4 z-10 flex gap-2">
    <div
      class="rounded-lg border border-gray-200/50 bg-white/90 p-1 shadow-lg backdrop-blur-sm">
      <div class="flex">
        <button
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-lg transition-all duration-200 {currentMapStyle ===
          'outdoors'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => switchMapStyle("outdoors")}
          title="Street Map"
          data-umami-event="Street Map">
          🗺️
        </button>
        <button
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-lg transition-all duration-200 {currentMapStyle ===
          'satellite'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => switchMapStyle("satellite")}
          title="Satellite View"
          data-umami-event="Satellite View">
          🛰️
        </button>
      </div>
    </div>

    <div
      class="rounded-lg border border-gray-200/50 bg-white/90 p-1 shadow-lg backdrop-blur-sm">
      <div class="flex">
        <button
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-lg transition-all duration-200 {!showHeatmap
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => {
            if (showHeatmap) toggleHeatmap();
          }}
          title="Markers View"
          data-umami-event="Markers View">
          📍
        </button>
        <button
          class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-lg transition-all duration-200 {showHeatmap
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'}"
          on:click={() => {
            if (!showHeatmap) toggleHeatmap();
          }}
          title="Heatmap View"
          data-umami-event="Heatmap View">
          🔥
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(.photo-marker:hover) {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }

  :global(.mapboxgl-popup-content) {
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 0;
  }

  :global(.mapboxgl-popup-close-button) {
    width: 32px !important;
    height: 32px !important;
    font-size: 20px !important;
    font-weight: bold !important;
    right: 8px !important;
    top: 8px !important;
    background: rgba(0, 0, 0, 0.6) !important;
    color: white !important;
    border-radius: 50% !important;
    border: none !important;
    line-height: 32px !important;
    text-align: center !important;
    transition: all 0.2s ease !important;
    cursor: pointer !important;
    font-family: Arial, sans-serif !important;
    z-index: 10 !important;
  }

  :global(.mapboxgl-popup-close-button:hover) {
    background: rgba(0, 0, 0, 0.8) !important;
    transform: scale(1.1) !important;
  }

  :global(.line-clamp-2) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
