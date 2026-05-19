import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import React from "react";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <>
        {/* Header: back button + title */}
        <div className="flex flex-col gap-4">
          <div className="h-[16px] w-[80px] bg-neutral-100 rounded-full animate-pulse" />
          <div className="h-[32px] w-[240px] lg:w-[340px] bg-neutral-200 rounded-full animate-pulse mb-4" />
        </div>

        <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 overflow-y-auto h-full">
          {/* Colonne gauche */}
          <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
            {/* Banner image */}
            <div className="w-full h-[29.8rem] rounded-[10px] bg-neutral-100 animate-pulse shrink-0" />

            {/* OrganizerActions: follow + stats */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="h-[36px] w-[100px] bg-neutral-100 rounded-full animate-pulse" />
                <div className="h-[36px] w-[100px] bg-neutral-100 rounded-full animate-pulse" />
              </div>
              <div className="h-[36px] w-[90px] bg-neutral-200 rounded-full animate-pulse" />
            </div>

            {/* Separator */}
            <div className="w-full h-[1px] bg-neutral-100 animate-pulse" />

            {/* About */}
            <div className="flex flex-col gap-4">
              <div className="h-[16px] w-[80px] bg-neutral-200 rounded-full animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-[13px] w-full bg-neutral-100 rounded-full animate-pulse" />
                <div className="h-[13px] w-5/6 bg-neutral-100 rounded-full animate-pulse" />
                <div className="h-[13px] w-4/6 bg-neutral-100 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Mobile: upcoming events */}
            <div className="lg:hidden w-full h-[1px] bg-neutral-100 animate-pulse" />
            <div className="lg:hidden flex flex-col gap-8">
              <div className="h-[16px] w-[120px] bg-neutral-200 rounded-full animate-pulse" />
              <ul className="flex flex-col gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i}>
                    <EventCardSkeleton />
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile: past events */}
            <div className="lg:hidden flex flex-col gap-8">
              <div className="h-[16px] w-[100px] bg-neutral-200 rounded-full animate-pulse" />
              <ul className="flex flex-col gap-8">
                {Array.from({ length: 2 }).map((_, i) => (
                  <li key={i}>
                    <EventCardSkeleton />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Colonne droite — desktop only */}
          <div className="hidden lg:flex lg:flex-col gap-8 p-4 pt-0 overflow-y-auto min-h-0">
            {/* Upcoming */}
            <div className="flex flex-col gap-4">
              <div className="h-[16px] w-[120px] bg-neutral-200 rounded-full animate-pulse" />
              <ul className="flex flex-col gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i}>
                    <EventCardSkeleton />
                  </li>
                ))}
              </ul>
            </div>

            {/* Past */}
            <div className="flex flex-col gap-4">
              <div className="h-[16px] w-[100px] bg-neutral-200 rounded-full animate-pulse" />
              <ul className="flex flex-col gap-8">
                {Array.from({ length: 2 }).map((_, i) => (
                  <li key={i}>
                    <EventCardSkeleton />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </>
    </AttendeeLayout>
  );
}
function EventCardSkeleton() {
  return (
    <div className="w-full rounded-2xl bg-neutral-100 animate-pulse p-3 lg:p-4 flex gap-3 lg:gap-4">
      <div className="w-[70px] h-[70px] lg:w-[90px] lg:h-[90px] rounded-xl bg-neutral-200 shrink-0" />
      <div className="flex flex-col gap-2 lg:gap-3 flex-1 justify-center">
        <div className="h-[14px] lg:h-[16px] w-3/4 bg-neutral-200 rounded-full" />
        <div className="h-[12px] lg:h-[13px] w-1/2 bg-neutral-200 rounded-full" />
        <div className="h-[22px] w-[70px] bg-neutral-200 rounded-full" />
      </div>
    </div>
  );
}
