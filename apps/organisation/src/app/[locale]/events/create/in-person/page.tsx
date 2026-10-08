import { redirect } from "next/navigation";

/**
 * The old category list before the in-person form. Creating an event is one
 * page now (Figma › Create Event): the type is its first field and the
 * category is chosen inside Event Details. Kept as a redirect for bookmarks.
 */
export default function InPersonEventTypePage() {
  redirect("/events/create/event?type=physical");
}
