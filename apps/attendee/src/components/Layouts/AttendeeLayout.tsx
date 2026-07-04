import React from "react";
import Sidebar from "@/components/Layouts/Sidebar";
import MobileNavigation from "./MobileNavigation";
import Head from "next/head";
import { cn } from "@/lib/utils";
import WelcomeModal from "@/components/WelcomeModal";

function AttendeeLayout({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <Head>
        <title>{title} - Ticketwaze</title>
      </Head>
      <WelcomeModal />
      <div
        className={
          "bg-neutral-200 p-6 pt-8 lg:p-8 min-h-dvh lg:h-dvh grid lg:grid-cols-12 lg:overflow-hidden"
        }
      >
        <Sidebar className={"col-start-1 col-end-3 pr-8"} />
        <main className="flex flex-col flex-1 overflow-x-hidden  lg:overflow-y-auto lg:col-start-3 lg:col-end-13 ">
          <div
            className={cn(
              "bg-white min-h-[calc(100dvh-3.5rem)] lg:min-h-0 lg:h-full flex flex-col gap-8 main rounded-[3rem] lg:overflow-y-hidden p-6 lg:p-16 pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-0 overflow-x-hidden",
              className,
            )}
          >
            {children}
          </div>
          <MobileNavigation />
        </main>
      </div>
    </>
  );
}

export default AttendeeLayout;
