"use client";

import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@ticketwaze/currency";
import { axisLabels, keyToDate, type Granularity } from "./axis";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export type RevenuePoint = {
  key: string;
  isNow: boolean;
  /** null for buckets still in the future, so the line stops at "Now". */
  htg: number | null;
  usd: number | null;
};

const ORANGE = "#E45B00";
const MUTED = "#8F96A1";

/**
 * Figma "Revenue Growth": a flat orange line over a faint fill, a dashed
 * marker at "Now", and a white card naming the hovered bucket (the current
 * one when nothing is hovered) with its HTG and USD revenue. Empty periods
 * show the design's dashed baseline and "No data".
 */
export default function RevenueChart({
  points,
  granularity,
}: {
  points: RevenuePoint[];
  granularity: Granularity;
}) {
  const t = useTranslations("Analytics.chart");
  const locale = useLocale();
  const nowIndex = Math.max(0, points.findIndex((p) => p.isNow));
  const isEmpty = points.every((p) => !p.htg);

  type Anchor = { x: number; y: number };
  const [hovered, setHovered] = useState<{ index: number; at: Anchor } | null>(null);
  const [nowAnchor, setNowAnchor] = useState<Anchor | null>(null);
  const active = hovered?.index ?? nowIndex;
  const anchor = hovered?.at ?? nowAnchor;

  const labels = useMemo(
    () => axisLabels(points, granularity, locale, t("now")),
    [points, granularity, locale, t],
  );

  const nowLine: Plugin<"line"> = useMemo(
    () => ({
      id: "nowLine",
      afterDatasetsDraw(chart) {
        if (isEmpty) return;
        const el = chart.getDatasetMeta(0).data[nowIndex];
        if (!el) return;
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.strokeStyle = "#FF914B";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(el.x, chartArea.top);
        ctx.lineTo(el.x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
        setNowAnchor((prev) =>
          prev && prev.x === el.x && prev.y === el.y ? prev : { x: el.x, y: el.y },
        );
      },
    }),
    [nowIndex, isEmpty],
  );

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        data: points.map((p) => (isEmpty ? 0 : p.htg)),
        borderColor: ORANGE,
        borderWidth: 1.5,
        borderDash: isEmpty ? [4, 4] : [],
        tension: 0,
        fill: !isEmpty,
        backgroundColor: (ctx) => {
          const area = ctx.chart.chartArea;
          if (!area) return "rgba(228, 91, 0, 0.06)";
          const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
          g.addColorStop(0, "rgba(228, 91, 0, 0.10)");
          g.addColorStop(1, "rgba(228, 91, 0, 0)");
          return g;
        },
        pointRadius: (ctx) => (!isEmpty && ctx.dataIndex === active ? 5 : 0),
        pointHoverRadius: 5,
        pointBackgroundColor: "#FFFFFF",
        pointBorderColor: ORANGE,
        pointBorderWidth: 1.5,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 8 } },
    onHover: (_, elements) => {
      const hit = elements[0];
      if (!hit || points[hit.index]?.htg === null) return;
      const at = { x: hit.element.x, y: hit.element.y };
      setHovered((prev) =>
        prev?.index === hit.index && prev.at.x === at.x && prev.at.y === at.y
          ? prev
          : { index: hit.index, at },
      );
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          // Thinned from "Now" outwards, so "Now" is never the label dropped.
          autoSkip: false,
          maxRotation: 0,
          callback(_, index) {
            const fit = Math.max(2, Math.floor(this.chart.width / 30));
            const step = Math.ceil(labels.length / fit);
            return (index - nowIndex) % step === 0 ? labels[index] : "";
          },
          padding: 10,
          color: (ctx) => (ctx.index === nowIndex ? ORANGE : MUTED),
          font: (ctx) => ({
            size: 10,
            family: "var(--font-sans), DM Sans, sans-serif",
            weight: ctx.index === nowIndex ? 500 : 400,
          }),
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: isEmpty ? 4 : undefined,
        border: { display: false },
        grid: { color: "#F1F2F3", drawTicks: false },
        ticks: { display: false, count: 5 },
      },
    },
  };

  const point = points[active];
  const flip = anchor !== null && anchor.x < 140;
  const dateLabel = point
    ? new Intl.DateTimeFormat(
        locale,
        granularity === "day"
          ? { month: "short", day: "numeric", year: "numeric" }
          : { month: "short", year: "numeric" },
      ).format(keyToDate(point.key))
    : "";

  return (
    <div className="relative h-[16rem] w-full" onMouseLeave={() => setHovered(null)}>
      <Line data={data} options={options} plugins={[nowLine]} updateMode="none" />
      {isEmpty ? (
        <span className="absolute inset-x-0 top-[40%] text-center font-sans text-[1rem] leading-6 text-neutral-600 pointer-events-none">
          {t("no_data")}
        </span>
      ) : (
        anchor &&
        point && (
          <div
            className="absolute pointer-events-none bg-white rounded-[1rem] px-4 py-2 flex flex-col items-end text-right shadow-[0_20px_30px_rgba(0,0,0,0.15),0_5px_5px_rgba(0,0,0,0.1)]"
            style={{
              left: anchor.x,
              top: anchor.y,
              transform: flip ? "translate(14px, -50%)" : "translate(calc(-100% - 14px), -50%)",
            }}
          >
            <span className="font-sans text-[1rem] leading-6 text-neutral-600 whitespace-nowrap">
              {dateLabel}
            </span>
            <span className="font-primary font-medium text-[1.8rem] leading-10 text-primary-500 whitespace-nowrap">
              {formatMoney(point.htg ?? 0, "HTG", locale)}
            </span>
            <span className="font-sans text-[1.1rem] leading-6 text-neutral-500 whitespace-nowrap">
              {formatMoney(point.usd ?? 0, "USD", locale)}
            </span>
          </div>
        )
      )}
    </div>
  );
}
