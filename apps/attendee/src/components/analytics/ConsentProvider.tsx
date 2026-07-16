"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

export type Consent = "granted" | "denied" | "unknown";

const STORAGE_KEY = "tw-analytics-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// External store so the persisted choice can be read during render without a
// setState-in-effect, and stays in sync across tabs and same-tab updates.
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window !== "undefined")
    window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", cb);
  };
}

function readConsent(): Consent {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s === "granted" || s === "denied" ? s : "unknown";
  } catch {
    // localStorage can throw (private mode / blocked storage).
    return "unknown";
  }
}

function writeConsent(c: Consent): void {
  try {
    if (c === "unknown") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, c);
  } catch {}
  emit();
}

interface ConsentContextValue {
  consent: Consent;
  setConsent: (c: "granted" | "denied") => void;
  /** Re-opens the banner so the visitor can change their mind. */
  resetConsent: () => void;
}

const ConsentContext = createContext<ConsentContextValue>({
  consent: "unknown",
  setConsent: () => {},
  resetConsent: () => {},
});

export function useConsent() {
  return useContext(ConsentContext);
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // Server renders "unknown" so first paint runs nothing analytics-related;
  // the client snapshot then reflects the saved choice after hydration.
  const consent = useSyncExternalStore(
    subscribe,
    readConsent,
    () => "unknown" as Consent,
  );

  const setConsent = useCallback((c: "granted" | "denied") => {
    writeConsent(c);
    // Consent Mode v2: tell GA about the change for this page load. The gtag
    // shim exists from ConsentModeScript even before gtag.js finishes loading.
    window.gtag?.("consent", "update", {
      analytics_storage: c === "granted" ? "granted" : "denied",
    });
  }, []);

  const resetConsent = useCallback(() => writeConsent("unknown"), []);

  return (
    <ConsentContext.Provider value={{ consent, setConsent, resetConsent }}>
      {children}
    </ConsentContext.Provider>
  );
}
