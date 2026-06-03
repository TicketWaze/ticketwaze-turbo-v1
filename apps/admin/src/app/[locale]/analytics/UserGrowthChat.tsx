"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const labels = Array.from({ length: 31 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const data = {
  labels,
  datasets: [
    {
      label: "Attendee",
      data: labels.map(() => Math.floor(Math.random() * 200) + 50),
      backgroundColor: "#E45B00",
      barThickness: 12.5,
      // categoryPercentage: 0.8,
      // barPercentage: 0.45,
    },
    {
      label: "Organizer",
      data: labels.map(() => Math.floor(Math.random() * 100) + 20),
      backgroundColor: "#FFEFE2",
      barThickness: 12.5,
      // categoryPercentage: 0.8,
      // barPercentage: 0.45,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
      position: "top" as const,
      align: "end" as const,
    },
    tooltip: {
      backgroundColor: "#E45B00",
      titleColor: "#fff",
      bodyColor: "#fff",
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#999", font: { size: 10 } },
    },
    y: {
      grid: { color: "#f0f0f0", display: false },
      ticks: { color: "#999", display: false },
      beginAtZero: true,
    },
  },
};

export default function UserGrowthChart() {
  return (
    <div className="w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
