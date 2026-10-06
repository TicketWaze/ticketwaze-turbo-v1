"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { Gps, LocationAdd } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import PlaceSearch from "./PlaceSearch";

export interface SelectedLocation {
  lat: number;
  lng: number;
}

const DEFAULT_CENTER = { lat: 18.5944, lng: -72.3074 };

type Locate = "idle" | "locating" | "found" | "failed";

/** Leaves the map's full-screen view, if it is in one. */
function exitFullscreen() {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
  };
  if (doc.fullscreenElement) void doc.exitFullscreen?.().catch(() => {});
  else if (doc.webkitFullscreenElement) void doc.webkitExitFullscreen?.();
}

// ─── Inner map layer ─────────────────────────────────────────────────────────
function MapLayer({
  value,
  onLocationSelect,
  userLocation,
  locate,
  fallbackAddress,
  onLocateMe,
}: {
  value: SelectedLocation | null;
  onLocationSelect: (loc: SelectedLocation | null) => void;
  userLocation: SelectedLocation | null;
  locate: Locate;
  fallbackAddress: string;
  onLocateMe: () => void;
}) {
  const t = useTranslations("Events.create_event");
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");
  // The pin is the parent's value; this layer only reports clicks.
  const markerPos = value;

  // Follow the value chosen elsewhere (e.g. the edit form's stored pin).
  useEffect(() => {
    if (!value) return;
    map?.panTo(value);
  }, [value, map]);

  // The user's location arrived: frame it, unless a pin is already placed.
  // This only moves the view — the venue is still chosen by clicking.
  const framedUser = useRef<SelectedLocation | null>(null);
  useEffect(() => {
    if (!map || !userLocation || framedUser.current === userLocation) return;
    framedUser.current = userLocation;
    if (value) return;
    map.panTo(userLocation);
    map.setZoom(15);
  }, [map, userLocation, value]);

  // No device location (blocked or unavailable): open on the organisation's
  // city instead of the country-wide default. One lookup per map opening.
  const geocoded = useRef(false);
  useEffect(() => {
    if (locate !== "failed" || value || !map || !geocoding) return;
    if (!fallbackAddress || geocoded.current) return;
    geocoded.current = true;
    new geocoding.Geocoder()
      .geocode({ address: fallbackAddress })
      .then(({ results }) => {
        const viewport = results[0]?.geometry?.viewport;
        if (viewport) map.fitBounds(viewport);
      })
      .catch(() => {}); // Geocoding unavailable on the key: keep the default.
  }, [locate, value, map, geocoding, fallbackAddress]);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const latLng = e.detail.latLng;
      if (!latLng) return;
      const pos = { lat: latLng.lat, lng: latLng.lng };
      onLocationSelect(pos);
      // Picked in the big (full-screen) map: back to the form.
      exitFullscreen();
    },
    [onLocationSelect],
  );

  const clearMarker = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLocationSelect(null);
  };

  return (
    <>
      <Map
        style={{ width: "100%", height: "100%" }}
        defaultCenter={value ?? userLocation ?? DEFAULT_CENTER}
        defaultZoom={value ? 16 : userLocation ? 15 : 10}
        onClick={handleMapClick}
        clickableIcons={false}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
      >
        {markerPos && <Marker position={markerPos} />}
        {userLocation && !markerPos && (
          <Marker
            position={userLocation}
            clickable={false}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#2563EB",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            }}
          />
        )}
      </Map>

      <button
        type="button"
        onClick={onLocateMe}
        aria-label={t("location_me")}
        title={t("location_me")}
        className="absolute right-[10px] bottom-[110px] size-[40px] rounded-[2px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] flex items-center justify-center cursor-pointer"
      >
        <Gps
          size="20"
          variant={locate === "found" ? "Bold" : "Linear"}
          color={locate === "locating" ? "#9CA3AF" : "#E45B00"}
          className={locate === "locating" ? "animate-pulse" : ""}
        />
      </button>

      {!markerPos && (
        <div className="tw-hint">
          {locate === "locating" ? t("location_locating") : t("location_hint")}
        </div>
      )}

      {markerPos && (
        <div className="tw-card">
          <div className="tw-card-body">
            <p className="tw-coords">
              {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
            </p>
          </div>
          <button type="button" onClick={clearMarker} className="tw-clear">
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ─── Public component ────────────────────────────────────────────────────────
interface LocationPickerProps {
  value?: SelectedLocation | null;
  initialValue?: SelectedLocation | null;
  onLocationSelect?: (location: SelectedLocation | null) => void;
}

/**
 * "Pick on the map". Opens at once and moves to the user's own location when
 * the browser gives it (no spinner in front of the map); when location is
 * blocked or unavailable, it opens on the organisation's city instead. A pin
 * dropped in full-screen mode leaves full screen.
 */
export default function LocationPicker({
  value,
  initialValue = null,
  onLocationSelect,
}: LocationPickerProps) {
  const t = useTranslations("Events.create_event");
  const { data: session } = useSession();
  const [internalValue, setInternalValue] = useState<SelectedLocation | null>(
    value ?? initialValue,
  );
  const [mapVisible, setMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<SelectedLocation | null>(
    null,
  );
  const [locate, setLocate] = useState<Locate>("idle");

  // Follow a controlled value.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== undefined) setInternalValue(value);
  }

  const organisation = session?.activeOrganisation;
  const fallbackAddress = [
    organisation?.city,
    organisation?.state,
    organisation?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const handleSelect = useCallback(
    (loc: SelectedLocation | null) => {
      setInternalValue(loc);
      onLocationSelect?.(loc);
    },
    [onLocationSelect],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocate("failed");
      return;
    }
    setLocate("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // A new object each time, so "my location" re-frames even if unmoved.
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocate("found");
      },
      () => setLocate("failed"),
      // A recent fix is fine for framing a map, and much faster.
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  const handleOpen = () => {
    setMapVisible(true);
    // An existing pin is where the map opens; otherwise the user's location.
    if (!internalValue) requestLocation();
  };

  return (
    <>
      <div className="tw-picker">
        {!mapVisible ? (
          <button
            type="button"
            className="tw-button font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900"
            onClick={handleOpen}
          >
            <LocationAdd size="24" variant="Bulk" />
            {internalValue ? t("location_update") : t("location_pick")}
          </button>
        ) : (
          // The provider loads the Google Maps script (several hundred KB),
          // so it mounts with the map, not with the form around the button.
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
            <PlaceSearch onPick={handleSelect} />
            <div className="tw-map-wrap h-[300px]">
              <MapLayer
                value={internalValue}
                onLocationSelect={handleSelect}
                userLocation={userLocation}
                locate={locate}
                fallbackAddress={fallbackAddress}
                onLocateMe={requestLocation}
              />
            </div>
          </APIProvider>
        )}
      </div>

      <style>{`
        .tw-button{
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          padding:18px;
          border-radius:999px;
          background:#f3f4f6;
          cursor:pointer;
          font-size:16px;
          width : 100%;
        }
        .tw-map-wrap{position:relative;border-radius:14px;overflow:hidden;border:1.5px solid #e5e7eb}
        .tw-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#fff;padding:6px 12px;border-radius:999px;font-size:12px;white-space:nowrap}
        .tw-card{position:absolute;bottom:16px;left:16px;right:16px;background:#fff;border-radius:10px;padding:10px;display:flex;justify-content:space-between;align-items:center}
        .tw-coords{font-size:12px;color:#6b7280}
        .tw-clear{background:none;border:none;cursor:pointer}
      `}</style>
    </>
  );
}
