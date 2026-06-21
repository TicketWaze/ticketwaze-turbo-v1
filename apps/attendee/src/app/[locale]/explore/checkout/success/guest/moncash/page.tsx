import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import GuestMoncashSuccessContent from "./GuestMoncashSuccessContent";

export default async function GuestMoncashSuccess({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; name?: string }>;
}) {
  const { slug, name } = await searchParams;
  const locale = await getLocale();

  if (!slug) {
    redirect({ href: "/explore", locale });
  }

  return (
    <AttendeeLayout title="Booking Confirmed">
      <GuestMoncashSuccessContent
        slug={slug!}
        name={decodeURIComponent(name ?? "")}
      />
    </AttendeeLayout>
  );
}
