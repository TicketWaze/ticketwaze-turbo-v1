"use client";
import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";

// Gap kept above a pinned section, matching the page's outer padding.
const PIN_TOP_PX = 40;
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Scroll-driven steps for a section that pins on desktop.
 *
 * Wrap the section in `trackRef`, give the section `sectionRef` and
 * `style={{ top: pinTop }}` with `lg:sticky`, and put a spacer of
 * `spacerHeight` after it inside the track. While the section is pinned, the
 * page scroll is split evenly into `stepCount` steps.
 *
 * `goTo` moves to a step: on desktop it scrolls the page there (the scroll
 * listener then updates `step`), below lg it just sets the step.
 *
 * A section taller than the window pins with its bottom on the window's bottom
 * edge instead, so none of it is out of reach while pinned.
 */
export function usePinnedSteps(stepCount: number, stepScrollVh = 60) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pinTop, setPinTop] = useState(PIN_TOP_PX);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const update = () =>
      setPinTop(
        Math.min(
          PIN_TOP_PX,
          window.innerHeight - section.offsetHeight - PIN_TOP_PX,
        ),
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(section);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const setActive = (next: number) => {
    if (next === stepRef.current) return;
    setDirection(next > stepRef.current ? 1 : -1);
    stepRef.current = next;
    setStep(next);
  };

  const measure = () => {
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section || !window.matchMedia(DESKTOP_QUERY).matches)
      return null;
    const scrollable = track.offsetHeight - section.offsetHeight;
    return scrollable > 0 ? { track, scrollable } : null;
  };

  useMotionValueEvent(scrollY, "change", () => {
    const m = measure();
    if (!m) return;
    const progress =
      (pinTop - m.track.getBoundingClientRect().top) / m.scrollable;
    const clamped = Math.min(Math.max(progress, 0), 0.9999);
    setActive(Math.floor(clamped * stepCount));
  });

  const goTo = (next: number) => {
    const target = Math.min(Math.max(next, 0), stepCount - 1);
    const m = measure();
    if (!m) {
      setActive(target);
      return;
    }
    const trackTop = m.track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      // A couple of pixels past the boundary, so rounding lands inside it.
      top: trackTop - pinTop + (target / stepCount) * m.scrollable + 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return {
    trackRef,
    sectionRef,
    pinTop,
    step,
    direction,
    goTo,
    reduceMotion,
    spacerHeight: `${(stepCount - 1) * stepScrollVh}vh`,
  };
}
