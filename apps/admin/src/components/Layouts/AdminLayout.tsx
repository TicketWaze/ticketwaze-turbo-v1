import React from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import { AdminSocketProvider } from "@/lib/AdminSocketContext";

function AdminLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AdminSocketProvider>
      <div
        className={
          "bg-neutral-200 p-6 pt-8 lg:p-8 h-dvh grid lg:grid-cols-12 overflow-hidden"
        }
      >
        <Sidebar className={"col-start-1 col-end-3 pr-8"} />
        {/* `min-h-0 overflow-hidden` is what bounds the card below.
            Without it the card's `h-full` resolved to this column's full
            height, the mobile nav pushed the total past it, and `main` itself
            scrolled — dragging any `sticky` heading inside the card out of
            view even though the card had a scroller of its own. */}
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden justify-between lg:col-start-3 lg:col-end-13">
          <div
            className={cn(
              // `flex-1 min-h-0` rather than `h-full`: the card takes the space
              // left over after the mobile nav instead of claiming all of it.
              // It keeps `overflow-y-auto` below lg for pages that scroll
              // their whole body; pages that bring their own scroller
              // (PAGE_SCROLLER) never fill it, so the two do not fight.
              "bg-white flex-1 min-h-0 flex flex-col gap-8 main rounded-[3rem] overflow-y-auto lg:overflow-y-hidden p-6 lg:p-16 pb-0 lg:pb-0",
              className,
            )}
          >
            {children}
          </div>
          <MobileNavigation className="w-full h-auto bg-neutral-200 p-6" />
        </main>
      </div>
    </AdminSocketProvider>
  );
}

export default AdminLayout;
