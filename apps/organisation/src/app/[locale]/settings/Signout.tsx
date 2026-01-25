"use client";
import { ButtonRed } from "@/components/shared/buttons";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function Signout() {
  const t = useTranslations("Settings");
  const { data: session } = useSession();
  return (
    <li className="lg:hidden">
      <ButtonRed
        className="w-full"
        onClick={() =>
          signOut({
            redirect: true,
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/${session?.user.userPreference.appLanguage}`,
          })
        }
      >
        {t("logout")}
      </ButtonRed>
    </li>
  );
}
