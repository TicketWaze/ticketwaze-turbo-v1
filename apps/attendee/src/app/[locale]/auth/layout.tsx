import React from "react";
import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-white.svg";
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
          width={140}
          height={40}
          className="mb-[50px]"
        />
        <h1 className="mb-8 font-primary font-bold text-[4.5rem] leading-[6.2rem] text-white max-w-[600px]">
          {t("title")}
        </h1>
        <p className="mb-14 text-[1.8rem] leading-[2.5rem] text-neutral-200 max-w-[422px]">
          {t("description")}
        </p>
        <Image src={ticket} alt="Ticket auth" className=" self-center" />
      </div>
      <main className="bg-white lg:rounded-[3rem] px-6 lg:px-32 overflow-x-hidden overflow-y-scroll">
        {children}
      </main>
    </section>
  );
}
