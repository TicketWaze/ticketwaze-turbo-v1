"use client";

import { useEffect, useRef, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { CloseCircle, Location, SearchNormal1 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import type { SelectedLocation } from "./LocationPicker";

type Suggestion = {
  id: string;
  main: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
};

// Each suggestion lookup is billed, so wait for a real word and a real pause.
const MIN_CHARS = 4;
const DEBOUNCE_MS = 600;

/**
 * Search box above the location map (Places API, new): type a venue or an
 * address, pick a suggestion, and the pin drops there. Results lean toward
 * the area the map shows. Typing and picking share one session token, so
 * Google bills them as a single search; only the location is fetched for the
 * picked place (the cheapest details fields).
 */
export default function PlaceSearch({
  onPick,
}: {
  onPick: (location: SelectedLocation) => void;
}) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const map = useMap();
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState<"idle" | "loading" | "empty" | "error">(
    "idle",
  );
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestId = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  // Results already fetched while the map is open, by lowercased input.
  const cache = useRef(new Map<string, Suggestion[]>());

  useEffect(() => () => clearTimeout(timer.current), []);

  // Close the list on a click outside the search box.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function show(list: Suggestion[]) {
    setResults(list);
    setActive(list.length ? 0 : -1);
    setState(list.length ? "idle" : "empty");
  }

  async function search(input: string) {
    if (!places) return;
    const id = ++requestId.current;
    // Typed back to something already searched (a deleted then retyped
    // letter): reuse those results instead of paying for the lookup again.
    const key = input.toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      show(cached);
      return;
    }
    setState("loading");
    try {
      token.current ??= new places.AutocompleteSessionToken();
      const bounds = map?.getBounds();
      const { suggestions } =
        await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: token.current,
          language: locale,
          ...(bounds ? { locationBias: bounds } : {}),
        });
      if (id !== requestId.current) return; // a newer search is on its way
      const list: Suggestion[] = suggestions
        .map((s) => s.placePrediction)
        .filter((p): p is google.maps.places.PlacePrediction => Boolean(p))
        .slice(0, 5)
        .map((p) => ({
          id: p.placeId,
          main: p.mainText?.text ?? p.text.text,
          secondary: p.secondaryText?.text ?? "",
          prediction: p,
        }));
      cache.current.set(key, list);
      show(list);
    } catch {
      if (id !== requestId.current) return;
      setResults([]);
      setState("error");
    }
  }

  function onType(value: string) {
    setQuery(value);
    setOpen(true);
    clearTimeout(timer.current);
    const input = value.trim();
    if (input.length < MIN_CHARS) {
      requestId.current++;
      setResults([]);
      setState("idle");
      return;
    }
    timer.current = setTimeout(() => void search(input), DEBOUNCE_MS);
  }

  async function pick(suggestion: Suggestion) {
    setOpen(false);
    setQuery(suggestion.main);
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ["location"] });
      token.current = null; // the search session ends with the pick
      const location = place.location;
      if (!location) throw new Error("no location");
      const picked = { lat: location.lat(), lng: location.lng() };
      onPick(picked);
      map?.panTo(picked);
      map?.setZoom(17);
    } catch {
      setState("error");
      setOpen(true);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Never submit the activity form from here.
      e.preventDefault();
      if (open && results[active]) void pick(results[active]);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    }
  }

  const charsLeft = Math.max(0, MIN_CHARS - query.trim().length);
  const showList =
    open &&
    query.trim().length >= MIN_CHARS &&
    (results.length > 0 || state !== "idle");

  return (
    <div ref={boxRef} className="relative mb-4">
      <div className="flex items-center gap-3 bg-neutral-100 rounded-[5rem] h-[5.2rem] px-6 border border-transparent focus-within:border-primary-500 transition-colors">
        <SearchNormal1 size="18" color="#737C8A" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls="place-search-list"
          aria-autocomplete="list"
          aria-describedby={
            open && charsLeft > 0 ? "place-search-hint" : undefined
          }
          aria-activedescendant={
            showList && results[active]
              ? `place-${results[active].id}`
              : undefined
          }
          value={query}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("location_search")}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] text-deep-200 placeholder:text-neutral-500"
        />
        {state === "loading" && (
          <span className="size-[1.6rem] rounded-full border-2 border-neutral-200 border-t-primary-500 animate-spin shrink-0" />
        )}
        {query && state !== "loading" && (
          <button
            type="button"
            onClick={() => onType("")}
            aria-label={t("location_search_clear")}
            className="shrink-0 cursor-pointer"
          >
            <CloseCircle size="18" color="#9CA3AF" variant="Bulk" />
          </button>
        )}
      </div>

      {/* Lookups start at MIN_CHARS (each one is billed): say so, rather
          than leave a short query looking broken. */}
      {open && charsLeft > 0 && (
        <p
          id="place-search-hint"
          aria-live="polite"
          className="px-6 pt-2 text-[1.2rem] text-neutral-500"
        >
          {charsLeft === MIN_CHARS
            ? t("location_search_min", { min: MIN_CHARS })
            : t("location_search_more", { count: charsLeft })}
        </p>
      )}

      {showList && (
        <ul
          id="place-search-list"
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-[1.5rem] border border-neutral-100 shadow-[0px_10px_30px_0px_rgba(0,0,0,0.08)] p-2 max-h-[28rem] overflow-y-auto"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`place-${r.id}`}
              role="option"
              aria-selected={i === active}
              onPointerDown={(e) => e.preventDefault()} // keep input focus
              onClick={() => void pick(r)}
              onMouseEnter={() => setActive(i)}
              className={`flex items-start gap-3 px-4 py-3 rounded-[1rem] cursor-pointer ${i === active ? "bg-neutral-100" : ""}`}
            >
              <Location
                size="18"
                color="#E45B00"
                variant="Bulk"
                className="shrink-0 mt-[0.2rem]"
              />
              <span className="flex flex-col min-w-0">
                <span className="text-[1.4rem] text-deep-100 truncate">
                  {r.main}
                </span>
                {r.secondary && (
                  <span className="text-[1.2rem] text-neutral-500 truncate">
                    {r.secondary}
                  </span>
                )}
              </span>
            </li>
          ))}
          {results.length === 0 && state === "empty" && (
            <li className="px-4 py-3 text-[1.3rem] text-neutral-500">
              {t("location_search_empty")}
            </li>
          )}
          {state === "error" && (
            <li className="px-4 py-3 text-[1.3rem] text-failure">
              {t("location_search_error")}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
