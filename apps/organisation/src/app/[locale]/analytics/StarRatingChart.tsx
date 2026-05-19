"use client";
import { useTranslations } from "next-intl";

interface Props {
  distribution: Record<string, number>;
  average: string;
  total: number;
}

export default function StarRatingChart({ distribution, average, total }: Props) {
  const t = useTranslations("Analytics");
  const stars = [5, 4, 3, 2, 1] as const;
  const dist = distribution ?? {};

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline gap-2">
        <span className="text-[3.2rem] font-primary font-medium text-black leading-none">
          {average}
        </span>
        <span className="text-[1.4rem] font-primary text-neutral-400">/5</span>
        <span className="text-[14px] font-sans text-neutral-500 ml-1">
          ({total} {t("reviews.total").toLowerCase()})
        </span>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {stars.map((star) => {
          const count = dist[String(star)] ?? 0;
          const widthPct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-[13px] font-sans text-neutral-600 w-6 text-right flex-shrink-0">
                {star}★
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-[13px] font-sans text-neutral-500 w-6 text-right flex-shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
