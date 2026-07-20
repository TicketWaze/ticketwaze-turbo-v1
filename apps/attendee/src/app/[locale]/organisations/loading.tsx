import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import React from "react";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <>
        <header className="w-full flex items-center">
          <div className="w-full flex flex-col gap-2">
            <div className="h-[1.6rem] w-36 lg:w-[16rem] bg-neutral-100 rounded-full animate-pulse" />
            <div className="w-full flex justify-between items-center">
              <div className="h-[2.4rem] lg:h-[3.2rem] w-56 lg:w-120 bg-neutral-200 rounded-full animate-pulse mt-1" />
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex bg-neutral-100 rounded-[30px] w-[24.3rem] h-[4.4rem] animate-pulse" />
                <div className="hidden lg:flex bg-neutral-100 rounded-[30px] w-[24.3rem] h-20 animate-pulse" />
                <div className="w-14 h-14 bg-neutral-100 rounded-full animate-pulse lg:hidden" />
              </div>
            </div>
            <div className="h-20 hidden lg:flex lg:w-56 bg-neutral-100 rounded-full animate-pulse mt-8" />
          </div>
        </header>

        <ul className="pt-4 list  w-full flex flex-col gap-4 pb-8 h-screen overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index}>
              <div className="w-full rounded-2xl bg-neutral-100 animate-pulse flex flex-col gap-3 lg:gap-4">
                {/* Image */}
                <div className="w-full h-62  rounded-t-xl bg-neutral-200 shrink-0 mb-4" />

                <div className="flex flex-col gap-4 flex-1 justify-center p-3 lg:p-4 pt-0">
                  <div className="h-[1.9rem] w-3/4 bg-neutral-200 rounded-full" />
                  <div className="flex justify-between items-center">
                    <div className="h-[1.7rem] w-full bg-neutral-200 rounded-full" />
                    <div className="hidden h-14 w-[7.1rem] bg-neutral-200 rounded-full" />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </>
    </AttendeeLayout>
  );
}
