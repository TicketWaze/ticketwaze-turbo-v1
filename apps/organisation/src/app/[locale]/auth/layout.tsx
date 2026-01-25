import React from "react";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-white-org.svg";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import ticket from "@ticketwaze/ui/assets/images/ticket-auth-bg.svg";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Auth.layout");
  return (
    <section className="lg:p-8 lg:bg-primary-500 h-dvh overflow-hidden grid lg:grid-cols-2 gap-8">
      <div className="pt-12 pl-12 hidden lg:flex flex-col overflow-y-scroll no-scrollbar bg">
        <Image
          src={Logo}
          alt="Ticket Waze Logo"
          width={250}
          height={40}
          className="mb-20"
        />
        <h1 className="mb-8 font-primary font-bold text-[4.5rem] leading-[6.2rem] text-white max-w-240">
          {t("title")}
        </h1>
        <p className="mb-14 text-[1.8rem] leading-10 text-neutral-200 max-w-[42.2rem]">
          {t("description")}
        </p>
        <Image src={ticket} alt="Ticket auth" className=" self-center" />
      </div>
      <main className="bg-white lg:rounded-[3rem] overflow-x-hidden px-6 lg:px-32 overflow-y-scroll">
        {children}
      </main>
    </section>
  );
}
