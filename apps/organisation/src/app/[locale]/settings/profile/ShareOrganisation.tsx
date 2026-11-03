"use client";
import { useState } from "react";
import { ButtonPill } from "@/components/shared/buttons";
import { slugify } from "@/lib/Slugify";
import { Organisation } from "@ticketwaze/typescript-config";
import { ShareDialog } from "@ticketwaze/ui/share";
import { Send2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";

/**
 * Share sheet for the organisation's public profile — the shared share modal
 * (@ticketwaze/ui), pointed at the attendee app rather than at an activity.
 *
 * The link is built with `slugify` so it matches the canonical URL the attendee
 * app links to and declares. The name is decorative there: the id at the end is
 * what resolves, so a link stays valid even if the organisation is renamed
 * after someone shares it.
 */
export default function ShareOrganisation({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.profile.share_profile");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ButtonPill onClick={() => setOpen(true)}>
        <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
        <span>{t("title")}</span>
      </ButtonPill>
      <ShareDialog
        open={open}
        onOpenChange={setOpen}
        kind="profile"
        link={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/organisations/${slugify(
          organisation.organisationName,
          organisation.organisationId,
        )}`}
        title={organisation.organisationName}
        description={organisation.organisationDescription}
        locale={locale}
      />
    </>
  );
}
