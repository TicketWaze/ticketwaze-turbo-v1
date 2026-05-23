// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

type TicketSale = { createdAt: string };

function processTicketsData(ticketSales: TicketSale[]) {
  const counts: Record<string, number> = {};

  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    counts[key] = 0;
  }

  for (const ticket of ticketSales) {
    const key = ticket.createdAt.slice(0, 10);
    if (key in counts) {
      counts[key]++;
    }
  }

  const labels = Object.keys(counts).map((d) => {
    const [, month, day] = d.split("-");
    return `${month}/${day}`;
  });
  const data = Object.values(counts);

  return { labels, data };
}

export default function DailyTicketSalesChart({
  ticketSales,
}: {
  ticketSales: TicketSale[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { labels, data } = processTicketsData(ticketSales);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Tickets Sold",
            data,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.08)",
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ${ctx.parsed.y} ticket${ctx.parsed.y !== 1 ? "s" : ""}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10 },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [ticketSales]);

  return <canvas ref={canvasRef} />;
}
