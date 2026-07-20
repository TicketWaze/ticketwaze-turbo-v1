"use client";
import React, { useSyncExternalStore } from "react";
import Sidebar from "@/components/Layouts/Sidebar";
import MobileNavigation from "./MobileNavigation";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tw:sidebar-collapsed";

/**
 * The collapsed flag lives in localStorage rather than component state because
 * OrganizerLayout is imported per page instead of being a real Next layout, so
 * every navigation remounts this tree. Without persistence the sidebar would
 * spring back open on every click, which is worse than not having the feature.
 *
 * It is read through useSyncExternalStore — localStorage is exactly the
 * "external store" that API exists for. That gives a correct server snapshot
 * without a hydration mismatch, and syncs other tabs for free.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab toggling the sidebar should move this one too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    // Private browsing or a blocked store: the sidebar just stays expanded.
    return false;
  }
}

/** The server has no store to read, and expanded is the honest default. */
function getServerSnapshot() {
  return false;
}

export default function SidebarShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function toggle() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(!collapsed));
    } catch {
      // Preference cannot be saved; nothing to toggle against, so bail out
      // rather than leave the UI disagreeing with the store.
      return;
    }
    emit();
  }

  return (
    <div className="bg-neutral-200 p-6 pt-8 lg:p-8 h-dvh flex overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        className={cn(
          "shrink-0 transition-[width] duration-300 ease-in-out",
          collapsed ? "lg:w-[9rem] pr-4" : "lg:w-[20%] pr-8",
        )}
      />
      {/* min-w-0 or a wide child (a table, a long title) would push the main
          column past the viewport instead of scrolling inside it. */}
      <main className="flex flex-col flex-1 min-w-0 overflow-y-auto justify-between">
        <div
          className={cn(
            "bg-white h-full flex flex-col gap-8 main rounded-[3rem] overflow-y-hidden p-6 lg:p-16 pb-0 lg:pb-0",
            className,
          )}
        >
          {children}
        </div>
        <MobileNavigation className="w-full h-auto bg-neutral-200 p-6" />
      </main>
    </div>
  );
}
