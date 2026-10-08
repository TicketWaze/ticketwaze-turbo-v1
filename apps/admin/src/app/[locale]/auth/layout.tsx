import React from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-white.svg";

// Figma "Admin" → Authentication: an orange frame with the illustrated panel
// (logo + ADMINISTRATOR badge) on the left and the white card on the right;
// phones get the card alone. Screens centre themselves at Figma's 530px.
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Auth.layout");
  return (
    <section className="lg:p-8 lg:bg-primary-500 h-dvh overflow-hidden grid lg:grid-cols-[38rem_1fr] gap-8">
      <div className="pt-12 pl-12 hidden lg:flex flex-col overflow-y-scroll no-scrollbar bg-admin-auth rounded-[30px] border-[.2rem] border-primary-600">
        <a
          href={process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://ticketwaze.com"}
          className="flex items-center gap-3 w-fit"
        >
          <Image src={Logo} alt="Ticketwaze" width={130} height={37} />
          <span className="bg-white flex rounded-[30px] px-3 py-[2.5px] text-[1.1rem] font-bold uppercase items-center leading-6 text-primary-500">
            {t("badge")}
          </span>
        </a>
      </div>
      <main className="bg-white lg:rounded-[3rem] px-6 lg:px-12 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </section>
  );
}
