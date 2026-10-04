// @ts-nocheck
"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { PanelTitle } from "./parts";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutItem {
  label: string;
  value: number;
  color: string;
}

interface Props {
  items: DonutItem[];
  title: string;
}

export default function DonutChart({ items, title }: Props) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  const hasData = total > 0;

  const chartData = {
    labels: hasData ? items.map((i) => i.label) : ["No data"],
    datasets: [
      {
        data: hasData ? items.map((i) => i.value) : [1],
        backgroundColor: hasData ? items.map((i) => i.color) : ["#F1F2F3"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "84%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: hasData },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <PanelTitle>{title}</PanelTitle>
      <div className="flex flex-row items-center gap-10">
        {/* Donut */}
        <div className="size-[10rem] shrink-0">
          <Doughnut data={chartData} options={options} />
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-4 min-w-0 flex-1">
          {hasData ? (
            items.map((item) => {
              const percentage =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="rounded-[.5rem] shrink-0"
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="text-[1.4rem] leading-8 font-sans text-neutral-600 truncate">
                    {item.label}
                  </span>
                  <span className="text-[1.4rem] leading-8 font-primary font-medium text-black ml-auto pl-4">
                    {percentage}%
                  </span>
                </div>
              );
            })
          ) : (
            <span className="text-[1.4rem] font-sans text-neutral-500">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
