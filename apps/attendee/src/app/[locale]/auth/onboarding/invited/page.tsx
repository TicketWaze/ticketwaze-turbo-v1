import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

// Organizer set-up and team invitations now live in the organisation app
// (Figma "Organizers + Mobile"); old links land on its onboarding, which
// routes to set-up, a pending invitation or the dashboard.
export default async function Page() {
  const locale = await getLocale();
  redirect(`${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/auth/onboarding`);
}
