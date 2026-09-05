"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import { DocumentDownload, DocumentText } from "iconsax-reactjs";
import { toast } from "sonner";
import type {
  EventFormQuestion,
  EventFormResponse,
} from "@ticketwaze/typescript-config";
import { ButtonSecondary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import Capitalize from "@/lib/Capitalize";
import { loadPdfLogo } from "@/lib/pdfLogo";

/**
 * Getting the answers out of the dashboard.
 *
 * The activity report already carries a checkout-answers table, but it only
 * appears once the activity is PAST — and these answers are almost always
 * needed before it: meal choices to give the caterer, allergies, shirt sizes.
 * An export that arrives after the event answers a question nobody is still
 * asking, so the answers get their own download here, available the moment
 * somebody has answered.
 *
 * COLUMNS COME FROM THE QUESTION LIST, matching the table above it: a question
 * nobody answered still gets a column, and a retired one keeps the answers it
 * drew. Building columns from the answers instead would produce a file whose
 * shape changes with the data.
 */
export default function ExportAnswers({
  responses,
  questions,
  eventName,
}: {
  responses: EventFormResponse[];
  questions: EventFormQuestion[];
  eventName: string;
}) {
  const t = useTranslations("Events.single_event.forms");
  const locale = useLocale();
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  /** Answers indexed by question, so a blank cell means "not answered". */
  function cellsFor(response: EventFormResponse) {
    const byQuestion = new Map(
      response.answers.map((answer) => [answer.eventFormQuestionId, answer]),
    );
    return questions.map((question) => {
      const answer = byQuestion.get(question.eventFormQuestionId);
      if (!answer) return "";
      // The "Other" marker travels with the text; without it a typed answer
      // and a chosen one read identically in a spreadsheet.
      return answer.isOther ? `${answer.answer} (${t("other_tag")})` : answer.answer;
    });
  }

  const columnLabel = (question: EventFormQuestion) =>
    question.isActive ? question.label : `${question.label} (${t("retired")})`;

  /** Strips characters that are invalid in file names, as the report does. */
  const fileName = () =>
    `${eventName.replace(/[\\/:*?"<>|]/g, "").trim() || t("title")} — ${t("tab_responses")}`;

  function downloadCsv() {
    if (busy) return;
    setBusy("csv");
    try {
      /**
       * RFC 4180 quoting: wrap every field and double any quote inside it.
       * Answers are free text — a comma, a newline or a quote in one of them
       * would otherwise shift every later column on that row.
       */
      const quote = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const header = [
        t("col_attendee"),
        "Email",
        t("col_ticket"),
        ...questions.map(columnLabel),
        t("col_date"),
      ];
      const rows = responses.map((response) => [
        response.fullName,
        response.email,
        `${response.ticketName} (${Capitalize(response.ticketType)})`,
        ...cellsFor(response),
        DateTime.fromISO(String(response.answeredAt))
          .setLocale(locale)
          .toLocaleString(DateTime.DATE_MED),
      ]);

      const csv = [header, ...rows]
        .map((row) => row.map(quote).join(","))
        .join("\r\n");

      /**
       * The BOM is what makes Excel open this as UTF-8. Without it the French
       * labels and any accented answer arrive mojibaked, which is exactly the
       * kind of thing nobody notices until a caterer gets the wrong list.
       */
      const blob = new Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("export_error"));
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    if (busy) return;
    setBusy("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      // Landscape: a column per question plus the attendee does not fit
      // portrait once a form asks more than three or four things.
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const logo = await loadPdfLogo();
      if (logo) {
        const logoWidth = 120;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        doc.addImage(logo.data, "PNG", margin, y, logoWidth, logoHeight);
        y += logoHeight + 24;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const titleLines = doc.splitTextToSize(eventName, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 20 + 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(115, 124, 138);
      doc.text(`${t("tab_responses")} (${responses.length})`, margin, y);
      y += 14;
      doc.text(
        t("generated", {
          date: DateTime.now()
            .setLocale(locale)
            .toLocaleString(DateTime.DATETIME_MED),
        }),
        margin,
        y,
      );
      y += 20;
      doc.setDrawColor(228, 91, 0);
      doc.setLineWidth(1.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [228, 91, 0], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
        head: [[t("col_attendee"), ...questions.map(columnLabel), t("col_date")]],
        body: responses.map((response) => [
          `${response.fullName}\n${response.email}`,
          ...cellsFor(response).map((cell) => cell || "—"),
          DateTime.fromISO(String(response.answeredAt))
            .setLocale(locale)
            .toLocaleString(DateTime.DATE_MED),
        ]),
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(115, 124, 138);
        doc.text(
          `${i} / ${pageCount}`,
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 20,
          { align: "right" },
        );
      }

      doc.save(`${fileName()}.pdf`);
    } catch {
      toast.error(t("export_error"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-4 self-end">
      <ButtonSecondary
        type="button"
        onClick={downloadCsv}
        disabled={busy !== null}
        className="flex items-center gap-3"
      >
        {busy === "csv" ? (
          <LoadingCircleSmall />
        ) : (
          <DocumentText size="20" variant="Bulk" color="#E45B00" />
        )}
        <span>{t("export_csv")}</span>
      </ButtonSecondary>
      <ButtonSecondary
        type="button"
        onClick={downloadPdf}
        disabled={busy !== null}
        className="flex items-center gap-3"
      >
        {busy === "pdf" ? (
          <LoadingCircleSmall />
        ) : (
          <DocumentDownload size="20" variant="Bulk" color="#E45B00" />
        )}
        <span>{t("export_pdf")}</span>
      </ButtonSecondary>
    </div>
  );
}
