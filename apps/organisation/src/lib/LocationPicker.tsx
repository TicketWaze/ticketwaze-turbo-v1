/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { LocationAdd } from "iconsax-reactjs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useTranslations } from "next-intl";

export interface SelectedLocation {
  lat: number;
  lng: number;
}

const DEFAULT_CENTER = { lat: 18.5944, lng: -72.3074 };

// ─── Inner map layer ─────────────────────────────────────────────────────────
function MapLayer({
  value,
  onLocationSelect,
  panTarget,
  onPanDone,
  userLocation,
}: {
  value: SelectedLocation | null;
  onLocationSelect?: (loc: SelectedLocation) => void;
  panTarget: SelectedLocation | null;
  onPanDone: () => void;
  userLocation: SelectedLocation | null;
}) {
  const map = useMap();
  const [markerPos, setMarkerPos] = useState<SelectedLocation | null>(value);
  const prevPanTarget = useRef<SelectedLocation | null>(null);

  // Sync with external value (important)
  useEffect(() => {
    if (value) {
      setMarkerPos(value);
      map?.panTo(value);
    }
  }, [value, map]);

  // Handle external pan requests
  if (map && panTarget && panTarget !== prevPanTarget.current) {
    prevPanTarget.current = panTarget;
    map.panTo(panTarget);
    map.setZoom(20);
    setMarkerPos(panTarget);
    onLocationSelect?.(panTarget);
    onPanDone();
  }

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const latLng = e.detail.latLng;
      if (!latLng) return;

      const pos = { lat: latLng.lat, lng: latLng.lng };
      setMarkerPos(pos);
      onLocationSelect?.(pos);
    },
    [onLocationSelect],
  );

  const clearMarker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkerPos(null);
    onLocationSelect?.(null as any); // optional: handle null upstream
  };

  return (
    <>
      <Map
        style={{ width: "100%", height: "100%" }}
        defaultCenter={value ?? userLocation ?? DEFAULT_CENTER}
        defaultZoom={value ? 16 : userLocation ? 14 : 10}
        onClick={handleMapClick}
        clickableIcons={false}
        gestureHandling="greedy"
      >
        {markerPos && <Marker position={markerPos} />}
      </Map>

      {!markerPos && (
        <div className="tw-hint">Click anywhere on the map to drop a pin</div>
      )}

      {markerPos && (
        <div className="tw-card">
          <div className="tw-card-body">
            <p className="tw-coords">
              {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
            </p>
          </div>
          <button onClick={clearMarker} className="tw-clear">
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ─── Public component ────────────────────────────────────────────────────────
interface LocationPickerProps {
  value?: SelectedLocation | null; // 👈 controlled value
  initialValue?: SelectedLocation | null; // 👈 fallback
  onLocationSelect?: (location: SelectedLocation | null) => void;
}

export default function LocationPicker({
  value,
  initialValue = null,
  onLocationSelect,
}: LocationPickerProps) {
  const t = useTranslations("Events.create_event");
  const [internalValue, setInternalValue] = useState<SelectedLocation | null>(
    value ?? initialValue,
  );

  const [panTarget, setPanTarget] = useState<SelectedLocation | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<SelectedLocation | null>(
    null,
  );
  const [locating, setLocating] = useState(false);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleSelect = (loc: SelectedLocation | null) => {
    setInternalValue(loc);
    onLocationSelect?.(loc);
  };

  const handleOpen = () => {
    setMapVisible(true);

    // If already have a value → pan to it
    if (internalValue) {
      setPanTarget(internalValue);
      return;
    }

    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(loc);
        setPanTarget(loc);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 6000 },
    );
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}>
      <div className="tw-picker">
        {!mapVisible ? (
          <button className="tw-button font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900" onClick={handleOpen}>
            <LocationAdd size="24" variant="Bulk" />
            {internalValue ? t("location_update") : t("location_pick")}
          </button>
        ) : locating ? (
          <div className="flex items-center justify-center p-6"><LoadingCircleSmall/></div>
        ) : (
          <div className="tw-map-wrap h-[300px]">
            <MapLayer
              value={internalValue}
              onLocationSelect={handleSelect}
              panTarget={panTarget}
              onPanDone={() => setPanTarget(null)}
              userLocation={userLocation}
            />
          </div>
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
        .tw-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#fff;padding:6px 12px;border-radius:999px;font-size:12px}
        .tw-card{position:absolute;bottom:16px;left:16px;right:16px;background:#fff;border-radius:10px;padding:10px;display:flex;justify-content:space-between;align-items:center}
        .tw-coords{font-size:12px;color:#6b7280}
        .tw-clear{background:none;border:none;cursor:pointer}
      `}</style>
    </APIProvider>
  );
}
