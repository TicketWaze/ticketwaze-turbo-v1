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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

export type SalesSeries = {
  granularity: "day" | "month";
  points: { key: string; count: number | null; isNow: boolean }[];
};

const ORANGE = "#E45B00";
const MUTED = "#8F96A1";

function keyToDate(key: string) {
  // yyyy-MM-dd or yyyy-MM, read as a local calendar date.
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d ?? 1);
}

/**
 * The ticket-sales line (Figma "Daily Ticket Sales"): flat orange line over a
 * faint fill, a dashed marker at "Now", and a white card naming the hovered
 * bucket — the current one when nothing is hovered.
 */
export default function SalesLineChart({ series }: { series?: SalesSeries }) {
  const t = useTranslations("Analytics.tickets");
  const locale = useLocale();
  const points = useMemo(() => series?.points ?? [], [series]);
  const granularity = series?.granularity ?? "day";
  const nowIndex = Math.max(
    0,
    points.findIndex((p) => p.isNow),
  );
  const isEmpty = points.every((p) => !p.count);

  // The hovered bucket and where it sits; the current bucket when nothing is
  // hovered. The parent keys this component by filter, so a new series always
  // starts from "Now".
  type Anchor = { x: number; y: number };
  const [hovered, setHovered] = useState<{ index: number; at: Anchor } | null>(
    null,
  );
  const [nowAnchor, setNowAnchor] = useState<Anchor | null>(null);
  const active = hovered?.index ?? nowIndex;
  const anchor = hovered?.at ?? nowAnchor;

  const labels = useMemo(() => {
    const month = new Intl.DateTimeFormat(locale, { month: "short" });
    return points.map((p) =>
      p.isNow
        ? t("now")
        : granularity === "day"
          ? p.key.slice(8)
          : month.format(keyToDate(p.key)),
    );
  }, [points, granularity, locale, t]);

  const tooltipDate = useMemo(() => {
    const p = points[active];
    if (!p) return "";
    return new Intl.DateTimeFormat(
      locale,
      granularity === "day"
        ? { month: "short", day: "numeric", year: "numeric" }
        : { month: "short", year: "numeric" },
    ).format(keyToDate(p.key));
  }, [points, active, granularity, locale]);

  const nowLine: Plugin<"line"> = useMemo(
    () => ({
      id: "nowLine",
      afterDatasetsDraw(chart) {
        // No marker in the empty state: the design shows only the flat
        // dashed line there.
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
        // Park the tooltip on "Now" — re-read on every draw so it follows resizes.
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
        // Empty: a flat dashed line across the whole axis, as in the design.
        data: points.map((p) => (isEmpty ? 0 : p.count)),
        borderColor: ORANGE,
        borderWidth: 1.5,
        borderDash: isEmpty ? [4, 4] : [],
        tension: 0,
        fill: !isEmpty,
        backgroundColor: (ctx) => {
          const area = ctx.chart.chartArea;
          if (!area) return "rgba(228, 91, 0, 0.06)";
          const g = ctx.chart.ctx.createLinearGradient(
            0,
            area.top,
            0,
            area.bottom,
          );
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
    // The line draws in on first paint, like the bars and cards around it.
    animation: { duration: 700, easing: "easeOutQuart" },
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 8 } },
    onHover: (_, elements) => {
      const hit = elements[0];
      if (!hit || points[hit.index]?.count === null) return;
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
          // Thin the labels ourselves, counting out from "Now" so it is never
          // the one skipped (Chart.js's autoSkip dropped it on phones).
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

  const count = points[active]?.count ?? 0;
  const flip = anchor !== null && anchor.x < 120;

  return (
    <div
      className="relative h-[16rem] w-full"
      onMouseLeave={() => setHovered(null)}
    >
      {/* Only the first draw animates; hover updates apply instantly. */}
      <Line
        data={data}
        options={options}
        plugins={[nowLine]}
        updateMode="none"
      />
      {isEmpty ? (
        <span className="absolute inset-x-0 top-[40%] text-center font-sans text-[1rem] leading-6 text-neutral-600 pointer-events-none">
          {t("noData")}
        </span>
      ) : (
        anchor && (
          <div
            className="absolute pointer-events-none bg-white rounded-[1rem] px-4 py-2 flex flex-col items-end text-right shadow-[0_20px_30px_rgba(0,0,0,0.15),0_5px_5px_rgba(0,0,0,0.1)]"
            style={{
              left: anchor.x,
              top: anchor.y,
              transform: flip
                ? "translate(14px, -50%)"
                : "translate(calc(-100% - 14px), -50%)",
            }}
          >
            <span className="font-sans text-[1rem] leading-6 text-neutral-600 whitespace-nowrap">
              {tooltipDate}
            </span>
            <span className="font-primary font-medium text-[1.8rem] leading-10 text-primary-500">
              {count.toLocaleString(locale)}
            </span>
          </div>
        )
      )}
    </div>
  );
}
