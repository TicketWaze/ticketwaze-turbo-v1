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
import { Ticket } from "@ticketwaze/typescript-config";

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

// Function to process tickets and generate sales data per day
const processTicketsData = (tickets) => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Create a map for the last 30 days
  const salesByDay = {};

  for (let i = 29; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth, currentDay - i);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    salesByDay[dateKey] = 0;
  }

  // Count tickets per day
  tickets.forEach((ticket) => {
    // Handle both Luxon DateTime objects and regular Date strings
    let ticketDate;

    if (ticket.createdAt?.ts) {
      // Luxon DateTime object
      ticketDate = new Date(ticket.createdAt.ts);
    } else if (typeof ticket.createdAt === "string") {
      // ISO string
      ticketDate = new Date(ticket.createdAt);
    } else if (ticket.createdAt instanceof Date) {
      // Already a Date object
      ticketDate = ticket.createdAt;
    } else {
      return; // Skip invalid dates
    }

    const dateKey = `${ticketDate.getFullYear()}-${String(ticketDate.getMonth() + 1).padStart(2, "0")}-${String(ticketDate.getDate()).padStart(2, "0")}`;

    if (salesByDay.hasOwnProperty(dateKey)) {
      salesByDay[dateKey]++;
    }
  });

  return Object.values(salesByDay);
};

const DailyTicketSalesChart = ({ tickets }: { tickets: Ticket[] }) => {
  const isMobile = useIsMobile();
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Generate last 30 days labels
  const getDaysLabels = () => {
    const labels = [];
    const daysOfWeek = ["", "", "", "", "", "", ""];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, currentDay - i);
      const dayName = daysOfWeek[date.getDay()];
      const dayNum = date.getDate();
      labels.push(`${dayName} ${dayNum}`);
    }
    return labels;
  };

  const allLabels = getDaysLabels();

  // Mark today's label
  // const formattedLabels = allLabels.map((label, i) =>
  //   i === allLabels.length - 1 ? `Aujourd'hui` : label
  // );

  // Process tickets to get sales data
  const allData = processTicketsData(tickets);

  // Function to select visible days for mobile (13 days including today)
  const getMobileLabels = () => {
    const visibleDays = 13;
    const start = allLabels.length - visibleDays;
    return allLabels.slice(start);
  };

  const data = {
    labels: isMobile ? getMobileLabels() : allLabels,
    datasets: [
      {
        label: "Ventes",
        data: isMobile ? allData.slice(allLabels.length - 13) : allData,
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
          title: (context: any) => {
            const label = context[0].label;
            return label === "Aujourd'hui" ? `Aujourd'hui` : label;
          },
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
          // maxTicksLimit: isMobile ? 13 : 15,
          font: (context: any) => ({
            size: isMobile ? 8 : 10,
            weight: context.tick.label === "Aujourd'hui" ? "bold" : "normal",
          }),
          color: (context: any) =>
            context.tick.label === "Aujourd'hui" ? "#F97316" : "#666",
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
