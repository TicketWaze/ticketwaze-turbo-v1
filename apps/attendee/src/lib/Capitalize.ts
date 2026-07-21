/**
 * Tolerates null/undefined because most callers pass API fields straight in and
 * several of those are nullable — a teaser event carries no address, city,
 * state or country at all, which crashed the page on `charAt` of null.
 */
export default function Capitalize(str: string | null | undefined) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
