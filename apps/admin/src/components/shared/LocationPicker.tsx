"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  APIProvider,
  Map,
  MapMouseEvent,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import { LocationAdd } from "iconsax-reactjs";
import { useTranslations } from "next-intl";

export interface SelectedLocation {
  lat: number;
  lng: number;
}

/** Port-au-Prince — where the map opens when there is nothing better to show. */
const DEFAULT_CENTER = { lat: 18.5944, lng: -72.3074 };

/**
 * The admin's copy of the organiser app's venue picker.
 *
 * DELIBERATELY A COPY rather than a shared package. The two differ in the only
 * places that matter: this one opens with the map already showing (an admin is
 * correcting a pin that exists, so hiding it behind a button costs a click
 * every time), never asks the browser for the admin's own location (they are
 * not at the venue, and a geolocation prompt in a back office is noise), and
 * reads its labels from the admin message catalogue. Extracting a component
 * with three behaviour flags to serve two callers would be the worse trade.
 */
function MapLayer({
  value,
  onLocationSelect,
}: {
  value: SelectedLocation | null;
  onLocationSelect: (loc: SelectedLocation | null) => void;
}) {
  const map = useMap();
  // Panning on every render would fight the admin's own dragging, so the map is
  // only recentred when the pin actually lands somewhere new.
  const lastPanned = useRef<string | null>(null);

  useEffect(() => {
    if (!value || !map) return;
    const key = `${value.lat},${value.lng}`;
    if (lastPanned.current === key) return;
    lastPanned.current = key;
    map.panTo(value);
  }, [value, map]);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const latLng = e.detail.latLng;
      if (!latLng) return;
      onLocationSelect({ lat: latLng.lat, lng: latLng.lng });
    },
    [onLocationSelect],
  );

  // Fully controlled: the marker renders straight off `value` rather than off a
  // copy kept in state. A local mirror would need an effect to stay in step
  // with the parent, which is a cascading render for no gain — the parent
  // already owns the pin, and Clear has to move it too.
  return (
    <Map
      style={{ width: "100%", height: "100%" }}
      defaultCenter={value ?? DEFAULT_CENTER}
      defaultZoom={value ? 16 : 11}
      onClick={handleMapClick}
      clickableIcons={false}
      gestureHandling="greedy"
    >
      {value && <Marker position={value} />}
    </Map>
  );
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation | null) => void;
}) {
  const t = useTranslations("Activities.edit.location");
  const [open, setOpen] = useState(false);

  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY);

  /**
   * Without a key the Maps script never loads and `APIProvider` renders an
   * empty grey box — which looks exactly like a map that has not finished
   * loading, so the admin waits for something that is never coming. Said out
   * loud instead, with the coordinates still readable and still clearable.
   */
  if (!hasKey) {
    return (
      <div className="rounded-[1.4rem] border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-[1.3rem] leading-8 text-neutral-600">
          {t("no_api_key")}
        </p>
        {value && (
          <p className="text-[1.3rem] leading-8 text-neutral-900 font-medium pt-2">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[1.3rem] leading-8 text-neutral-600">
          {value ? (
            <span className="text-neutral-900 font-medium">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </span>
          ) : (
            t("none")
          )}
        </p>
        <div className="flex items-center gap-4">
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-[1.3rem] leading-8 text-neutral-600 underline cursor-pointer"
            >
              {t("clear")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 text-[1.3rem] leading-8 text-primary-500 font-medium cursor-pointer"
          >
            <LocationAdd size="18" variant="Bulk" />
            {open ? t("hide") : value ? t("update") : t("pick")}
          </button>
        </div>
      </div>

      {open && (
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
          <div className="relative h-[30rem] rounded-[1.4rem] overflow-hidden border border-neutral-200">
            <MapLayer value={value} onLocationSelect={onChange} />
            {!value && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-[3rem] text-[1.2rem] pointer-events-none">
                {t("hint")}
              </div>
            )}
          </div>
        </APIProvider>
      )}
    </div>
  );
}
