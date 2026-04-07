"use client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { useTranslations } from "next-intl";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TicketType {
  name: string;
  percentage: number;
}

interface DoughnutChartProps {
  options?: ChartOptions<"doughnut">;
  analytics: { ticketTypePercentages: TicketType[] };
}

const TICKET_COLORS: Record<string, string> = {
  vip: "#FF8A9F",
  vvip: "#E752AE",
  general: "#FFEFE2",
};

const FALLBACK_COLORS = ["#A78BFA", "#34D399", "#60A5FA", "#FBBF24", "#F87171"];

function getColor(name: string, index: number): string {
  return (
    TICKET_COLORS[name.toLowerCase()] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

export default function TicketClassesChart({
  options,
  analytics,
}: DoughnutChartProps) {
  const t = useTranslations("Analytics");
  const raw = analytics.ticketTypePercentages ?? [];

  // Merge duplicate ticket types by summing their percentages
  const tickets = Object.values(
    raw.reduce<Record<string, TicketType>>((acc, ticket) => {
      const key = ticket.name.toLowerCase();
      if (acc[key]) {
        acc[key] = {
          ...acc[key],
          percentage: acc[key].percentage + ticket.percentage,
        };
      } else {
        acc[key] = { name: ticket.name, percentage: ticket.percentage };
      }
      return acc;
    }, {}),
  );

  const isEmpty = tickets.length === 0;

  const defaultData: ChartData<"doughnut"> = {
    datasets: [
      {
        data: tickets.map((t) => t.percentage),
        backgroundColor: tickets.map((t, i) => getColor(t.name, i)),
        borderWidth: 0,
        spacing: 0,
        hoverOffset: 0,
      },
    ],
  };

  const emptyData: ChartData<"doughnut"> = {
    datasets: [
      {
        data: [1],
        backgroundColor: ["#E0E0E0"],
        borderWidth: 0,
        spacing: 0,
        hoverOffset: 0,
      },
    ],
  };

  const defaultOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "85%",
    plugins: { legend: { display: false } },
    layout: { padding: 0 },
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row w-full">
      {/* Legend */}
      <div className="w-full flex flex-col gap-8 lg:gap-10">
        <span className="text-[14px] font-sans justify-start text-gray-800 text-base font-medium leading-tight lg:text-[15px]">
          {t("tickets.classes")}
        </span>

        <div className="flex justify-between items-start lg:grid lg:grid-cols-2 gap-x-20 lg:gap-y-14">
          {tickets.map((type, index) => (
            <div
              key={type.name}
              className="grid grid-cols justify-start items-start"
            >
              <div className="justify-start items-center gap-2 inline-flex">
                <div
                  className="w-6 h-6 rounded-[5px]"
                  style={{ backgroundColor: getColor(type.name, index) }}
                />
                <div className="text-[#8F96A1] text-[14px] font-sans font-medium capitalize">
                  {type.name}
                </div>
              </div>
              <div className="justify-start font-medium text-black text-[25px] font-primary capitalize leading-none">
                {type.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-70 justify-center items-center flex">
        <Doughnut
          data={isEmpty ? emptyData : defaultData}
          options={options || defaultOptions}
        />
      </div>
    </div>
  );
}
