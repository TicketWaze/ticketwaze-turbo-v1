"use client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-[#FFF7E6] text-[#B76E00]",
  approved: "bg-[#E8F8EF] text-[#1E8E4E]",
  rejected: "bg-[#FFF1F1] text-[#D32F2F]",
  unverified: "bg-neutral-100 text-neutral-700",
};

export default function KycStatusPill({ status }: { status: string }) {
  const t = useTranslations("Kyc.status");
  return (
    <span
      className={cn(
        "inline-flex items-center px-4 py-1 rounded-[10rem] text-[1.2rem] font-medium whitespace-nowrap",
        STYLES[status] ?? STYLES.unverified,
      )}
    >
      {t.has(status) ? t(status) : status}
    </span>
  );
}
