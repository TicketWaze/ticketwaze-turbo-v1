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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type UserGrowthPoint = { label: string; attendees: number; organizers: number };

export default function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const labels = data.map((d) => d.label);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Attendee",
        data: data.map((d) => d.attendees),
        backgroundColor: "#E45B00",
        barThickness: 12.5,
      },
      {
        label: "Organizer",
        data: data.map((d) => d.organizers),
        backgroundColor: "#FFEFE2",
        barThickness: 12.5,
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

  return (
    <div className="w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
