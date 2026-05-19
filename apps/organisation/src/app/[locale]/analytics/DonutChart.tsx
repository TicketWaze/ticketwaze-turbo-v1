// @ts-nocheck
"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

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
        backgroundColor: hasData ? items.map((i) => i.color) : ["#E5E7EB"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "80%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: hasData },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <span className="text-[14px] font-medium text-gray-800 font-sans">
        {title}
      </span>
      <div className="flex flex-row items-center gap-6">
        {/* Donut */}
        <div className="w-28 h-28 flex-shrink-0">
          <Doughnut data={chartData} options={options} />
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-2">
          {hasData ? (
            items.map((item) => {
              const percentage =
                total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="rounded flex-shrink-0"
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: item.color,
                    }}
                  />
                  <span className="text-[13px] font-sans text-neutral-700 truncate max-w-[140px]">
                    {item.label}
                  </span>
                  <span className="text-[13px] font-sans text-neutral-500 ml-auto">
                    {percentage}%
                  </span>
                </div>
              );
            })
          ) : (
            <span className="text-[13px] font-sans text-neutral-400">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
