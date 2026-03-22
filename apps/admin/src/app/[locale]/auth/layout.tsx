import React from "react";

import Logo from "@ticketwaze/ui/assets/images/logo-horizontal-white.svg";

import Image from "next/image";

import { getTranslations } from "next-intl/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Auth.layout");
  return (
    <section className="lg:p-8 lg:bg-primary-500 h-dvh overflow-hidden grid lg:grid-cols-[380px_1fr] gap-8">
      <div className="pt-12 pl-12 hidden lg:flex flex-col overflow-y-scroll no-scrollbar bg-admin-auth  rounded-[30px] border-[.2rem] border-primary-600">
        <div className=" flex gap-2">
          <Image
            src={Logo}
            alt="Ticket Waze Logo"
            width={140}
            height={40} // className="mb-[50px]"
          />
          <span className="bg-white flex rounded-[30px] px-2 py-[2.5px] text-[11px] font-bold uppercase text-center justify-center items-center leading-6 text-primary-500">
            {t("badge")}
          </span>
        </div>
      </div>
      <main className="bg-white lg:rounded-[3rem] px-6 lg:px-68 overflow-x-hidden overflow-y-scroll">
        {children}
      </main>
    </section>
  );
}
