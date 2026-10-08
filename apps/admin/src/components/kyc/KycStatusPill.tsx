"use client";
import { useTranslations } from "next-intl";
import { Badge, type BadgeTone } from "@/components/shared/DataTable";

const TONES: Record<string, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  unverified: "neutral",
};

export default function KycStatusPill({ status }: { status: string }) {
  const t = useTranslations("Kyc.status");
  return (
    <Badge tone={TONES[status] ?? "neutral"}>{t.has(status) ? t(status) : status}</Badge>
  );
}
