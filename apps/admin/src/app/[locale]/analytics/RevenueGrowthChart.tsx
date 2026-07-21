"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { useTranslations } from "next-intl";

Chart.register(...registerables);

type ChartPoint = { label: string; value: number };

export default function RevenueGrowthChart({ data }: { data: ChartPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const intl = useTranslations("Analytics.user.chart");

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const today = new Date().getDate();

    const filteredData = data.filter((item) => Number(item.label) <= today);
    const labels = filteredData.map((d, i) =>
      i === filteredData.length - 1 ? intl("today") : d.label,
    );

    const values = filteredData.map((d) => d.value);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(235, 104, 25, 0.15)");
    gradient.addColorStop(1, "rgba(235, 104, 25, 0.00)");

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: values,
            borderColor: "#eb6819",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 31,
              color: (context) =>
                context.tick.label === intl("today") ? "#eb6819" : "#b5b5b5",
              font: { size: 11 },
            },
          },
          y: {
            display: false,
            grid: { display: false },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div style={{ width: "100%", height: "200px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
