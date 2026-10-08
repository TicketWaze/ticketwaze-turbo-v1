"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useLocale, useTranslations } from "next-intl";
import { axisLabels, keyToDate, type Granularity } from "./axis";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export type SignupPoint = {
  key: string;
  isNow: boolean;
  attendees: number | null;
  organizers: number | null;
};

const ORANGE = "#E45B00";
const PEACH = "#FFEFE2";
const MUTED = "#8F96A1";

/**
 * Figma "User Signups": an attendee bar (orange) and an organizer bar (peach)
 * per bucket, "Now" in orange on the axis, and a dashed two-colour baseline
 * when the period has no signups.
 */
export default function SignupsChart({
  points,
  granularity,
}: {
  points: SignupPoint[];
  granularity: Granularity;
}) {
  const t = useTranslations("Analytics");
  const locale = useLocale();
  const nowIndex = Math.max(0, points.findIndex((p) => p.isNow));
  const isEmpty = points.every((p) => !p.attendees && !p.organizers);
  const labels = useMemo(
    () => axisLabels(points, granularity, locale, t("chart.now")),
    [points, granularity, locale, t],
  );

  // Empty: the design's dashed baseline in both series colours.
  const baseline: Plugin<"bar"> = useMemo(
    () => ({
      id: "emptyBaseline",
      afterDraw(chart) {
        if (!isEmpty) return;
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.lineWidth = 1.5;
        const y = chartArea.bottom - 1;
        for (let x = chartArea.left, i = 0; x < chartArea.right; x += 10, i++) {
          ctx.strokeStyle = i % 2 === 0 ? ORANGE : "#F06EAA";
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(Math.min(x + 6, chartArea.right), y);
          ctx.stroke();
        }
        ctx.restore();
      },
    }),
    [isEmpty],
  );

  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: t("growth.attendee"),
        data: points.map((p) => p.attendees),
        backgroundColor: ORANGE,
        borderRadius: 2,
        maxBarThickness: 12,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
      {
        label: t("growth.organizer"),
        data: points.map((p) => p.organizers),
        backgroundColor: PEACH,
        borderRadius: 2,
        maxBarThickness: 12,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: !isEmpty,
        backgroundColor: "#FFFFFF",
        titleColor: "#737C8A",
        bodyColor: "#232529",
        borderColor: "#F1F2F3",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          title: (items) => {
            const p = points[items[0]?.dataIndex ?? 0];
            if (!p) return "";
            return new Intl.DateTimeFormat(
              locale,
              granularity === "day"
                ? { month: "short", day: "numeric", year: "numeric" }
                : { month: "short", year: "numeric" },
            ).format(keyToDate(p.key));
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
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
        grid: { display: false },
        ticks: { display: false, precision: 0 },
      },
    },
  };

  return (
    <div className="relative h-[26rem] w-full">
      <Bar data={data} options={options} plugins={[baseline]} />
    </div>
  );
}
