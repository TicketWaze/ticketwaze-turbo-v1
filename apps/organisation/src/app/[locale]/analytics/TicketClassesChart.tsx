"use client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  ChartData,
  ChartOptions,
} from "chart.js";
import { useTranslations } from "next-intl";
import { Doughnut } from "react-chartjs-2";
import { PanelTitle } from "./parts";

ChartJS.register(ArcElement, Tooltip);

interface TicketType {
  name: string;
  percentage: number;
}

const TICKET_COLORS: Record<string, string> = {
  general: "#FFEFE2",
  vip: "#FF8A9F",
  vvip: "#E752AE",
  "premium vip": "#E752AE",
};

const FALLBACK_COLORS = ["#FFCFAB", "#F8751F", "#A78BFA", "#60A5FA", "#34D399"];

/** The design's three swatches, shown with "–" when nothing has sold. */
const EMPTY_SWATCHES = ["#FFEFE2", "#FF8A9F", "#E752AE"];

function getColor(name: string, index: number): string {
  return (
    TICKET_COLORS[name.toLowerCase()] ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
}

export default function TicketClassesChart({
  ticketTypePercentages = [],
}: {
  ticketTypePercentages?: TicketType[];
}) {
  const t = useTranslations("Analytics");

  // Merge duplicate ticket types by summing their percentages
  const tickets = Object.values(
    ticketTypePercentages.reduce<Record<string, TicketType>>((acc, ticket) => {
      const key = ticket.name.toLowerCase();
      acc[key] = acc[key]
        ? { ...acc[key], percentage: acc[key].percentage + ticket.percentage }
        : { name: ticket.name, percentage: ticket.percentage };
      return acc;
    }, {}),
  ).sort((a, b) => b.percentage - a.percentage);

  const isEmpty = tickets.length === 0;
  const legend = isEmpty
    ? EMPTY_SWATCHES.map((color) => ({ label: "–", value: "0", color }))
    : tickets.map((type, i) => ({
        label: type.name,
        value: `${Math.round(type.percentage)}%`,
        color: getColor(type.name, i),
      }));

  const data: ChartData<"doughnut"> = {
    datasets: [
      {
        data: isEmpty ? [1] : tickets.map((t) => t.percentage),
        backgroundColor: isEmpty
          ? ["#F1F2F3"]
          : tickets.map((t, i) => getColor(t.name, i)),
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "84%",
    // The ring sweeps round on first paint.
    animation: { animateRotate: true, duration: 800, easing: "easeOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: !isEmpty },
    },
  };

  return (
    <div className="flex flex-col gap-10 w-full lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-10 min-w-0">
        <PanelTitle>{t("tickets.classes")}</PanelTitle>
        <ul className="flex justify-between gap-6 lg:grid lg:grid-cols-2 lg:gap-x-20 lg:gap-y-10">
          {legend.map((item, i) => (
            <li key={`${item.label}-${i}`} className="flex flex-col min-w-0">
              <span className="flex items-center gap-2 font-sans text-[1.4rem] leading-8 text-neutral-600 min-w-0">
                <span
                  className="size-[1.5rem] shrink-0 rounded-[.5rem]"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate capitalize">{item.label}</span>
              </span>
              <span className="font-primary font-medium text-[1.6rem] lg:text-[2.5rem] leading-12 text-black">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="size-[17.5rem] shrink-0 self-center">
        <Doughnut data={data} options={options} updateMode="none" />
      </div>
    </div>
  );
}
