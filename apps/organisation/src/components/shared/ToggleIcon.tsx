/**
 * The white thumb of the dashboard's toggles (a sibling after the `peer`
 * checkbox). Moved with a transform, not `inset-inline-start`: iOS Safari
 * drew the animated logical offset as a half-hidden crescent.
 */
export default function ToggleIcon() {
  return (
    <span className="pointer-events-none absolute top-1 left-1 size-10 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-8"></span>
  );
}
