"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { DocumentText, Lock1, TickSquare, Grid5 } from "iconsax-reactjs";
import { toast } from "sonner";
import { Event, MembershipTier, Ticket } from "@ticketwaze/typescript-config";
import { Dialog } from "@/components/ui/dialog";
import ModalShell from "@/components/shared/ModalShell";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { cn } from "@/lib/utils";
import { EmailEventExport } from "@/actions/EventActions";
import {
  buildAttendeesXlsx,
  buildReportPdf,
  downloadBlob,
  exportBaseName,
  ReportT,
} from "./exportFiles";

type FileKind = "attendees" | "report";

/**
 * Figma's "Export Data" modal (1644:55656): the attendee list (Excel) and the
 * activity report (PDF), downloaded at once and emailed to the member who
 * exported them. The report stays a paid-plan feature, as it was.
 */
export default function ExportDialog({
  event,
  tickets,
  membershipTier,
  open,
  onOpenChange,
}: {
  event: Event;
  tickets: Ticket[];
  membershipTier: MembershipTier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Events.single_event.export_dialog");
  const tReport = useTranslations("Events.single_event.report");
  const locale = useLocale();
  const reportLocked = membershipTier.membershipName === "free";
  const [selected, setSelected] = useState<Record<FileKind, boolean>>({
    attendees: true,
    report: !reportLocked,
  });
  const [busy, setBusy] = useState(false);

  const files: {
    kind: FileKind;
    label: string;
    hint: string;
    icon: React.ReactNode;
    locked: boolean;
  }[] = [
    {
      kind: "attendees",
      label: t("attendees"),
      hint: t("attendees_hint"),
      icon: <Grid5 size="22" variant="Bulk" color="#349C2E" aria-hidden />,
      locked: false,
    },
    {
      kind: "report",
      label: t("report"),
      hint: reportLocked ? t("report_locked") : t("report_hint"),
      icon: (
        <DocumentText size="22" variant="Bulk" color="#DE0028" aria-hidden />
      ),
      locked: reportLocked,
    },
  ];

  async function handleExport() {
    const kinds = (Object.keys(selected) as FileKind[]).filter(
      (k) => selected[k] && !(k === "report" && reportLocked),
    );
    if (kinds.length === 0) {
      toast.error(t("none"));
      return;
    }
    setBusy(true);
    const base = exportBaseName(event, tReport("title"));
    const translate = tReport as unknown as ReportT;
    const form = new FormData();
    try {
      for (const kind of kinds) {
        const blob =
          kind === "attendees"
            ? await buildAttendeesXlsx(event, tickets, translate, locale)
            : await buildReportPdf(event, tickets, translate, locale);
        const name = kind === "attendees" ? `${base}.xlsx` : `${base}.pdf`;
        downloadBlob(blob, name);
        form.append(kind, blob, name);
      }
    } catch {
      toast.error(t("failed"));
      setBusy(false);
      return;
    }
    const sent = await EmailEventExport(event.eventId, form, locale);
    setBusy(false);
    if (sent.status === "success") {
      toast.success(t("emailed"));
      onOpenChange(false);
    } else {
      toast.warning(t("email_failed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <ModalShell
        title={t("title")}
        description={
          <>
            {t("description")}
            <span className="block mt-[1.5rem]">{t("email_note")}</span>
          </>
        }
      >
        <ul className="w-full flex flex-col gap-[1rem]">
          {files.map((f, i) => {
            const on = selected[f.kind] && !f.locked;
            return (
              <motion.li
                key={f.kind}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  disabled={f.locked || busy}
                  onClick={() =>
                    setSelected((s) => ({ ...s, [f.kind]: !s[f.kind] }))
                  }
                  className={cn(
                    "w-full flex items-center gap-[1.2rem] rounded-[1.5rem] border px-[1.5rem] py-[1.2rem] text-left cursor-pointer transition-colors",
                    on
                      ? "border-primary-500 bg-primary-50"
                      : "border-neutral-100 bg-white hover:border-neutral-200",
                    f.locked && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className="w-[4rem] h-[4rem] rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    {f.icon}
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col">
                    <span className="font-sans font-medium text-[1.5rem] leading-8 text-deep-100">
                      {f.label}
                    </span>
                    <span className="font-sans text-[1.3rem] leading-7 text-neutral-600">
                      {f.hint}
                    </span>
                  </span>
                  {f.locked ? (
                    <Lock1
                      size="20"
                      variant="Bulk"
                      color="#737C8A"
                      aria-hidden
                    />
                  ) : (
                    <TickSquare
                      size="22"
                      variant={on ? "Bold" : "Linear"}
                      color={on ? "#E45B00" : "#C7CBD0"}
                      aria-hidden
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
        <ButtonPrimary
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="w-full"
        >
          {busy ? <LoadingCircleSmall /> : t("download")}
        </ButtonPrimary>
      </ModalShell>
    </Dialog>
  );
}
