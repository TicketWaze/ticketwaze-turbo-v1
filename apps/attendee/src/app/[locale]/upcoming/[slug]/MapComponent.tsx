import { Event } from "@ticketwaze/typescript-config";
import Image from "next/image";

export type SimpleStyleSpec = {
  type: "FeatureCollection";
  features: [
    {
      type: "Feature";
      geometry: {
        type: "Point";
        coordinates: [number, number];
      };
      properties: {
        // OPTIONAL: default ""
        // A title to show when this item is clicked or
        // hovered over
        title?: string;

        // OPTIONAL: default ""
        // A description to show when this item is clicked or
        // hovered over
        description?: string;

        // OPTIONAL: default "medium"
        // specify the size of the marker. sizes
        // can be different pixel sizes in different
        // implementations
        // Value must be one of
        // "small"
        // "medium"
        // "large"
        "marker-size"?: "small" | "medium" | "large";

        // OPTIONAL: default ""
        // a symbol to position in the center of this icon
        // if not provided or "", no symbol is overlaid
        // and only the marker is shown
        // Allowed values include
        // - Icon ID
        // - An integer 0 through 9
        // - A lowercase character "a" through "z"
        "marker-symbol"?: string | number;

        // OPTIONAL: default "7e7e7e"
        // the marker's color
        //
        // value must follow COLOR RULES
        "marker-color"?: string;

        // OPTIONAL: default "555555"
        // the color of a line as part of a polygon, polyline, or
        // multigeometry
        //
        // value must follow COLOR RULES
        stroke?: string;

        // OPTIONAL: default 1.0
        // the opacity of the line component of a polygon, polyline, or
        // multigeometry
        //
        // value must be a floating point number greater than or equal to
        // zero and less or equal to than one
        "stroke-opacity"?: number;

        // OPTIONAL: default 2
        // the width of the line component of a polygon, polyline, or
        // multigeometry
        //
        // value must be a floating point number greater than or equal to 0
        "stroke-width"?: number;

        // OPTIONAL: default "555555"
        // the color of the interior of a polygon
        //
        // value must follow COLOR RULES
        fill?: string;

        // OPTIONAL: default 0.6
        // the opacity of the interior of a polygon. Implementations
        // may choose to set this to 0 for line features.
        //
        // value must be a floating point number greater than or equal to
        // zero and less or equal to than one
        "fill-opacity"?: number;
      };
    },
  ];
};

export default function MapComponent({ event }: { event: Event }) {
  const username = "mapbox";
  const style_id = "streets-v11";
  const lon = event.longitude;
  const lat = event.latitude;
  const zoom = 20;
  const width = 1280;
  const height = 720;

  // Use Mapbox's simple marker syntax instead of GeoJSON
  const markerOverlay = `pin-l+FF0000(${lon},${lat})`;

  const mapboxStaticImgUrl = `https://api.mapbox.com/styles/v1/${username}/${style_id}/static/${markerOverlay}/${lon},${lat},${zoom}/${width}x${height}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN}`;

  return (
    <div className="w-full relative">
      <Image alt="Map" src={mapboxStaticImgUrl} />
    </div>
  );
}
