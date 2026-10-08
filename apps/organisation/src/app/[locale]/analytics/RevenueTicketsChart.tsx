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
    if (!chartArea) return "#E45B00";
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    );
    gradient.addColorStop(0, "rgba(228, 91, 0, 0.10)");
    gradient.addColorStop(1, "rgba(228, 91, 0, 0)");
    return gradient;
  };

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        borderColor: "#E45B00",
        borderWidth: 1.5,
        pointBackgroundColor: "#E45B00",
        pointRadius: 0,
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
          font: { size: 10 },
          color: "#8F96A1",
        },
      },
      y: {
        grid: { color: "#F1F2F3" }, border: { display: false },
        ticks: {
          font: { size: 10 },
          color: "#8F96A1",
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
          className={`px-6 py-3 rounded-[3rem] text-[1.4rem] leading-8 font-sans cursor-pointer transition-colors ${
            mode === "revenue"
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          {t("chart.revenue")}
        </button>
        <button
          onClick={() => setMode("tickets")}
          className={`px-6 py-3 rounded-[3rem] text-[1.4rem] leading-8 font-sans cursor-pointer transition-colors ${
            mode === "tickets"
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
        >
          {t("chart.tickets")}
        </button>
      </div>
      <div className="h-[22rem] lg:h-[26rem]">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}
