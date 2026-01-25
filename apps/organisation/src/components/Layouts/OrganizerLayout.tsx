import React from "react";
import Sidebar from "@/components/Layouts/Sidebar";
import MobileNavigation from "./MobileNavigation";
import { cn } from "@/lib/utils";

function OrganizerLayout({
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
      <div
        className={
          "bg-neutral-200 p-6 pt-8 lg:p-8 h-dvh grid lg:grid-cols-10 overflow-hidden"
        }
      >
        <Sidebar className={"col-start-1 col-end-3 pr-8"} />
        <main className="flex flex-col flex-1 overflow-y-auto justify-between lg:col-start-3 lg:col-end-11">
          <div
            className={cn(
              "bg-white h-full flex flex-col gap-8 main rounded-[3rem] overflow-y-hidden p-6 lg:p-16 pb-0 lg:pb-0",
              className,
            )}
          >
            {children}
          </div>
          <MobileNavigation className="w-full h-auto bg-neutral-200 p-6" />
        </main>
      </div>
    </>
  );
}

export default OrganizerLayout;
