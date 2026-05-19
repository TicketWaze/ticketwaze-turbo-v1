// @ts-nocheck
"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from "chart.js";
import { useState, useEffect } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

const DailyTicketSalesChart = ({
  ticketsByDay,
}: {
  ticketsByDay: Array<{ day: string; count: number }>;
}) => {
  const isMobile = useIsMobile();
  const source = ticketsByDay ?? [];

  const allLabels = source.map((d) => d.day);
  const allData = source.map((d) => d.count);

  const mobileCount = 13;
  const mobileLabels = allLabels.slice(-mobileCount);
  const mobileData = allData.slice(-mobileCount);

  const data = {
    labels: isMobile ? mobileLabels : allLabels,
    datasets: [
      {
        label: "Ventes",
        data: isMobile ? mobileData : allData,
        fill: {
          target: "origin",
          above: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) return;

            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );

            gradient.addColorStop(0, "rgba(249, 115, 22, 0.3)");
            gradient.addColorStop(0.5, "rgba(249, 115, 22, 0.15)");
            gradient.addColorStop(1, "rgba(249, 115, 22, 0)");

            return gradient;
          },
        },
        borderColor: "#F97316",
        borderWidth: 1.5,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: "#F97316",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context: any) =>
            `${context.parsed.y} vente${context.parsed.y > 1 ? "s" : ""}`,
        },
        displayColors: false,
        backgroundColor: "#000000",
        titleFont: {
          size: 10,
          weight: "normal",
          color: "#8F96A1",
        },
        bodyFont: {
          size: 18,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          padding: 14,
          autoSkip: isMobile ? false : true,
          font: (context: any) => ({
            size: isMobile ? 8 : 10,
          }),
          color: "#666",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "#E5E7EB",
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <div className="w-full h-70 lg:h-80">
      <Line data={data} options={options} />
    </div>
  );
};

export default DailyTicketSalesChart;
