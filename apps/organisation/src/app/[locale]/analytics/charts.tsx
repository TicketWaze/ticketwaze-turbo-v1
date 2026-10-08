"use client";
import dynamic from "next/dynamic";

/*
 * The charts draw on a canvas in the browser, so rendering them on the server
 * gains nothing — and chart.js is ~60 KB. Loading them separately lets the
 * figures around them appear and become usable first; each chart fills in
 * when its code arrives.
 */

function ChartSkeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`bg-neutral-100 rounded-[1.5rem] animate-pulse w-full ${className}`}
    />
  );
}

export const SalesLineChart = dynamic(() => import("./SalesLineChart"), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-[16rem]" />,
});

export const TicketClassesChart = dynamic(
  () => import("./TicketClassesChart"),
  { ssr: false, loading: () => <ChartSkeleton className="h-[20rem]" /> },
);

export const RevenueTicketsChart = dynamic(
  () => import("./RevenueTicketsChart"),
  { ssr: false, loading: () => <ChartSkeleton className="h-[22rem] lg:h-[26rem]" /> },
);

export const DonutChart = dynamic(() => import("./DonutChart"), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-[20rem]" />,
});
