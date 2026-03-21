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
      <div className="pt-[30px] pl-[30px] hidden lg:flex flex-col overflow-y-scroll no-scrollbar bg-admin-auth  rounded-[30px] border-[2px] border-primary-600">
        <div className=" flex gap-[5px]">
          <Image
            src={Logo}
            alt="Ticket Waze Logo"
            width={140}
            height={40} // className="mb-[50px]"
          />
          <span className="bg-white flex rounded-[30px] px-[5px] py-[2.5px] text-[11px] font-bold uppercase text-center justify-center items-center leading-[15px] text-primary-500">
            {t("badge")}
          </span>
        </div>
      </div>
      <main className="bg-white lg:rounded-[3rem] px-6 lg:px-[170px] overflow-x-hidden overflow-y-scroll">{children}</main>
    </section>
  );
}
