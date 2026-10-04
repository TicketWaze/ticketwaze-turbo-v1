"use client";
import { useTranslations } from "next-intl";
import { GrowBar } from "@/components/shared/motion";

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
        <span className="text-[2.5rem] font-primary font-medium text-black leading-12">
          {average}
        </span>
        <span className="text-[2.5rem] font-primary font-medium text-neutral-500 leading-12">/ 5</span>
        <span className="text-[1.4rem] font-sans text-neutral-600 ml-2">
          ({total} {t("reviews.total").toLowerCase()})
        </span>
      </div>
      <div className="flex flex-col gap-6 w-full">
        {stars.map((star, i) => {
          const count = dist[String(star)] ?? 0;
          const widthPct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-6">
              <span className="text-[1.4rem] leading-8 font-sans text-deep-100 w-10 text-right flex-shrink-0">
                {star}★
              </span>
              <div className="flex-1 h-[.5rem] bg-neutral-100 rounded-[2rem] overflow-hidden">
                <GrowBar
                  value={widthPct}
                  delay={0.3 + i * 0.06}
                  className="block h-full bg-primary-500"
                />
              </div>
              <span className="text-[1.4rem] leading-8 font-sans text-deep-100 w-10 text-right flex-shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
