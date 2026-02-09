import React from "react";
import ChoicePageComponent from "./ChoicePageComponent";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function ChoicePage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  return <ChoicePageComponent />;
}
