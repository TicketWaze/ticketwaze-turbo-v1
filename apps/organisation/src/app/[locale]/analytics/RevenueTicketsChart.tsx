// @ts-nocheck
"use client";

import { useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTranslations } from "next-intl";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

interface Props {
  revenueByMonth: Array<{ month: string; revenue: number }>;
  ticketsByMonth: Array<{ month: string; count: number }>;
}

export default function RevenueTicketsChart({
  revenueByMonth,
  ticketsByMonth,
}: Props) {
  const t = useTranslations("Analytics");
  const [mode, setMode] = useState<"revenue" | "tickets">("revenue");
  const chartRef = useRef(null);

  const labels =
    mode === "revenue"
      ? revenueByMonth.map((d) => d.month)
      : ticketsByMonth.map((d) => d.month);

  const dataValues =
    mode === "revenue"
      ? revenueByMonth.map((d) => d.revenue)
      : ticketsByMonth.map((d) => d.count);

  const getGradient = (ctx, chartArea) => {
    if (!chartArea) return "#F97316";
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    );
    gradient.addColorStop(0, "rgba(249, 115, 22, 0.3)");
    gradient.addColorStop(1, "rgba(249, 115, 22, 0)");
    return gradient;
  };

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        borderColor: "#F97316",
        borderWidth: 2,
        pointBackgroundColor: "#F97316",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return getGradient(ctx, chartArea);
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return mode === "revenue" ? `$${val}` : String(val);
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          color: "#9CA3AF",
        },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 12 },
          color: "#9CA3AF",
          callback: (value) =>
            mode === "revenue" ? `$${value}` : String(value),
        },
      },
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode("revenue")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-sans transition-colors ${
            mode === "revenue"
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {t("chart.revenue")}
        </button>
        <button
          onClick={() => setMode("tickets")}
          className={`px-4 py-1.5 rounded-full text-[13px] font-sans transition-colors ${
            mode === "tickets"
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {t("chart.tickets")}
        </button>
      </div>
      <div className="h-70 lg:h-80">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
