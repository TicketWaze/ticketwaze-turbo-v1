// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { useTranslations } from "next-intl";

Chart.register(...registerables);

type TicketSale = { createdAt: string };
type ChartTranslations = {
  today: string;
  days: string[];
  tickets: string;
  ticketsPlural: string;
  forecast: string;
  ticketsSold: string;
};

function processTicketsDataByDay(
  ticketSales: TicketSale[],
  translations: ChartTranslations,
) {
  const counts: Record<string, number> = {};
  const today = new Date();

  // On génère 7 jours passés + Aujourd'hui (Now) + 2 jours futurs = 10 jours au total sur la courbe
  for (let i = 7; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    counts[key] = 0;
  }

  if (ticketSales && Array.isArray(ticketSales)) {
    for (const ticket of ticketSales) {
      const key = ticket.createdAt.slice(0, 10);
      if (key in counts) {
        counts[key]++;
      }
    }
  }

  const keys = Object.keys(counts);
  const data = Object.values(counts);
  const totalPoints = data.length;
  const todayIndex = totalPoints - 1;


  // Conversion des clés de date en jours de la semaine traduits
  const labels = keys.map((key, index) => {
    if (index === todayIndex) {
      return translations.today;
    }
    const d = new Date(key + "T00:00:00");
    return translations.days[d.getDay()]; // Récupère le bon jour traduit (Mon, Tue...)
  });

  return { labels, data, todayIndex };
}

interface ChartProps {
  ticketSales: TicketSale[];
}

export default function DailyTicketSalesChart({
  ticketSales = [],
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const intl = useTranslations("Analytics.tickets.daily_chart");
  const t = {
    today: intl("today"),
    days: [
      intl("sun"),
      intl("mon"),
      intl("tue"),
      intl("wed"),
      intl("thu"),
      intl("fri"),
      intl("sat"),
    ],
    tickets: intl("tickets"),
    ticketsPlural: intl("ticketsPlural"),
    forecast: intl("forecast"),
    ticketsSold: intl("ticketsSold"),
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Traitement des données basées sur les jours et la langue choisie
    const { labels, data, todayIndex } = processTicketsDataByDay(
      ticketSales,
      t,
    );

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
            label: "Tickets Sold",
            data,
            borderColor: "#eb6819",
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                if (index === todayIndex) return t.today;
                if (index > todayIndex)
                  return `${t.forecast} (+${index - todayIndex}d)`;
                return context[0].label;
              },
              label: (ctx) => {
                const count = ctx.parsed.y;
                const unit = count !== 1 ? t.ticketsPlural : t.tickets;
                return ` ${count} ${unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              stepSize: 1,
              maxTicksLimit: labels.length,
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              color: function (context) {
                if (context.tick.value === todayIndex) return "#eb6819";
                return "#b5b5b5";
              },
              font: { size: 11 },
            },
          },
          y: {
            display: false,
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: false,
              drawTicks: false,
              color: "rgba(181, 181, 181, 0.1)",
            },
            ticks: {
              display: false,
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [ticketSales, t]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ height: "200px", minHeight: "200px" }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
