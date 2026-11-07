import { redirect } from "next/navigation";

/**
 * A season is no longer created on its own: it comes with its first two
 * matches, from the Match form ("Add this match to a season?" › New season).
 * Kept as a redirect for old links.
 */
export default function CreateSeasonPage() {
  redirect("/events/create/match");
}
