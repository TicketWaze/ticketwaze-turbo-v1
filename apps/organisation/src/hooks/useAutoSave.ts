"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type SaveResult = { ok: boolean; message?: string };

/**
 * Settings that save as they are clicked. The screen changes at once; the
 * request goes out once the clicks pause (`delay`), with only one in flight at
 * a time — clicks made meanwhile ride on the next one. On a slow connection,
 * ten quick clicks are then two requests, never ten racing ones.
 *
 * A failure puts back what the server last confirmed (not the state before
 * one click, which used to drop the clicks made after it while their requests
 * still went through), and `onError` says why.
 *
 * `change` resolves to whether the save carrying that change succeeded.
 */
export function useAutoSave<T>(
  initial: T,
  send: (value: T) => Promise<SaveResult>,
  {
    delay = 500,
    onError,
  }: { delay?: number; onError?: (message?: string) => void } = {},
) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const latest = useRef(initial);
  const confirmed = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight = useRef(false);
  const dirty = useRef(false);
  const waiters = useRef<((ok: boolean) => void)[]>([]);
  const fade = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // "Saved" and "Not saved" show for a moment, then the indicator hides.
  const settle = useCallback((final: "saved" | "error") => {
    setStatus(final);
    clearTimeout(fade.current);
    fade.current = setTimeout(() => setStatus("idle"), 2200);
  }, []);
  const busy = useCallback(() => {
    clearTimeout(fade.current);
    setStatus("saving");
  }, []);
  const sendRef = useRef(send);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    sendRef.current = send;
    onErrorRef.current = onError;
  });

  const flush = useCallback(async () => {
    if (inFlight.current) return; // it picks up these changes when it's back
    while (dirty.current) {
      dirty.current = false;
      const snapshot = latest.current;
      const batch = waiters.current;
      waiters.current = [];
      // Clicked back to what is already saved: nothing to send.
      if (JSON.stringify(snapshot) === JSON.stringify(confirmed.current)) {
        batch.forEach((resolve) => resolve(true));
        settle("saved");
        continue;
      }
      inFlight.current = true;
      busy();
      let result: SaveResult;
      try {
        result = await sendRef.current(snapshot);
      } catch {
        result = { ok: false };
      }
      inFlight.current = false;
      if (result.ok) {
        confirmed.current = snapshot;
        batch.forEach((resolve) => resolve(true));
        // Clicked again while this one was out: the loop sends that next.
        if (!dirty.current) settle("saved");
        continue;
      }
      clearTimeout(timer.current);
      dirty.current = false;
      latest.current = confirmed.current;
      setValue(confirmed.current);
      [...batch, ...waiters.current].forEach((resolve) => resolve(false));
      waiters.current = [];
      settle("error");
      onErrorRef.current?.(result.message);
      return;
    }
  }, [settle, busy]);

  const change = useCallback(
    (update: (previous: T) => T) => {
      const next = update(latest.current);
      latest.current = next;
      setValue(next);
      dirty.current = true;
      busy();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
      return new Promise<boolean>((resolve) => waiters.current.push(resolve));
    },
    [flush, delay, busy],
  );

  // Leaving mid-save would lose the last clicks: let the browser ask first.
  useEffect(() => {
    if (status !== "saving") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  // Navigating away inside the app: send what is still waiting for the pause.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(fade.current);
      void flush();
    },
    [flush],
  );

  /** The value including clicks not saved yet, for decisions made on click. */
  const current = useCallback(() => latest.current, []);

  return { value, status, change, current };
}
