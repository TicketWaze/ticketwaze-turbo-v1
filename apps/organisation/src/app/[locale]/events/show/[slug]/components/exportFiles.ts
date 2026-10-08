import Capitalize from "@/lib/Capitalize";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import { DateTime } from "luxon";
import { loadPdfLogo } from "@/lib/pdfLogo";

/*
 * The two files of the detail page's Export: the attendee list (Excel) and
 * the activity report (PDF). Both are built in the browser and returned as
 * Blobs, so the same bytes are downloaded and emailed.
 */

/** A translator bound to "Events.single_event.report". */
export type ReportT = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** The activity name minus characters that are invalid in file names. */
export function exportBaseName(event: Event, fallback: string) {
  return event.eventName.replace(/[\\/:*?"<>|]/g, "").trim() || fallback;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const price = (event: Event, ticket: Ticket) =>
  event.currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice;

function statusLabel(t: ReportT, status: Ticket["status"]) {
  if (status === "CHECKED") return t("checked");
  if (status === "RETURNED") return t("returned");
  return t("not_checked");
}

// Turns the tiptap HTML description into plain text for the PDF.
function stripHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return (parsed.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * The attendee list as a spreadsheet: one row per ticket, sorted by name, with
 * every checkout question as an extra column (in the order they were asked).
 */
export async function buildAttendeesXlsx(
  event: Event,
  tickets: Ticket[],
  t: ReportT,
  locale: string,
): Promise<Blob> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const zone =
    [...event.eventDays].sort((a, b) => a.dayNumber - b.dayNumber)[0]
      ?.timezone ?? "utc";

  const questions: { id: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const ticket of tickets) {
    for (const answer of ticket.formAnswers ?? []) {
      if (seen.has(answer.eventFormQuestionId)) continue;
      seen.add(answer.eventFormQuestionId);
      questions.push({
        id: answer.eventFormQuestionId,
        label: answer.questionLabel,
      });
    }
  }

  const head = [
    t("ticket_id"),
    t("name"),
    t("email"),
    t("ticket_class"),
    `${t("amount")} (${event.currency})`,
    t("status"),
    t("date_purchased"),
    ...questions.map((q) => q.label),
  ].map((value) => ({ value, fontWeight: "bold" as const }));

  const rows = [...tickets]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((ticket) => {
      const answers = new Map(
        (ticket.formAnswers ?? []).map((a) => [
          a.eventFormQuestionId,
          a.answer,
        ]),
      );
      return [
        ticket.ticketName,
        ticket.fullName,
        ticket.email,
        Capitalize(ticket.ticketType),
        Number(price(event, ticket)),
        statusLabel(t, ticket.status),
        DateTime.fromISO(String(ticket.createdAt))
          .setZone(zone)
          .setLocale(locale)
          .toFormat("yyyy-LL-dd HH:mm"),
        ...questions.map((q) => answers.get(q.id) ?? ""),
      ];
    });

  return writeXlsxFile([head, ...rows], {
    sheet: t("attendees").slice(0, 31),
    stickyRowsCount: 1,
    columns: [
      { width: 16 },
      { width: 26 },
      { width: 30 },
      { width: 16 },
      { width: 14 },
      { width: 14 },
      { width: 18 },
      ...questions.map(() => ({ width: 28 })),
    ],
  }).toBlob();
}

/** The PDF activity report: details, ticket statistics, attendee list, answers. */
export async function buildReportPdf(
  event: Event,
  tickets: Ticket[],
  t: ReportT,
  locale: string,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const revenue = tickets.reduce((acc, curr) => acc + price(event, curr), 0);
  const checked = tickets.filter((tk) => tk.status === "CHECKED").length;
  const pending = tickets.filter((tk) => tk.status === "PENDING").length;
  const returned = tickets.filter((tk) => tk.status === "RETURNED").length;
  const attendanceBase = tickets.length - returned;
  const attendanceRate =
    attendanceBase > 0 ? Math.round((checked / attendanceBase) * 100) : 0;

  const sortedDays = [...event.eventDays].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
  const days = sortedDays
    .map((day) => {
      const date = DateTime.fromISO(day.eventDate, { zone: "utc" })
        .setZone(day.timezone, { keepLocalTime: true })
        .setLocale(locale)
        .toLocaleString(DateTime.DATE_FULL);
      return `${date}  ${day.startTime} - ${day.endTime}`;
    })
    .join("\n");
  const location =
    event.eventCategory === "meet"
      ? t("online")
      : [event.address, event.city, event.country].filter(Boolean).join(", ");

  // Header
  const logo = await loadPdfLogo();
  if (logo) {
    const logoWidth = 120;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    doc.addImage(logo.data, "PNG", margin, y, logoWidth, logoHeight);
    y += logoHeight + 24;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(event.eventName, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(115, 124, 138);
  doc.text(
    `${t("title")} — ${event.organisation?.organisationName ?? ""}`,
    margin,
    y,
  );
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

  // Activity details
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(t("details"), margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 120, textColor: [115, 124, 138] },
    },
    body: [
      [t("date"), days],
      [t("location"), location],
      [t("category"), Capitalize(event.eventType ?? event.eventCategory)],
      [t("currency"), event.currency],
    ],
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 20;

  // Description
  const description = stripHtml(event.eventDescription ?? "");
  if (description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(t("description"), margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(46, 50, 55);
    const descLines = doc.splitTextToSize(description, contentWidth);
    for (const line of descLines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    }
    y += 10;
    doc.setTextColor(0, 0, 0);
  }

  // Ticket stats
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(t("ticket_stats"), margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [228, 91, 0], fontSize: 9 },
    styles: { fontSize: 10, cellPadding: 6 },
    head: [[t("ticket_class"), t("sold"), t("checked"), t("revenue")]],
    body: event.eventTicketTypes.map((type) => {
      const typeTickets = tickets.filter(
        (tk) =>
          tk.ticketType.toLowerCase() === type.ticketTypeName.toLowerCase(),
      );
      const typeRevenue = typeTickets.reduce(
        (acc, curr) => acc + price(event, curr),
        0,
      );
      const typeChecked = typeTickets.filter(
        (tk) => tk.status === "CHECKED",
      ).length;
      return [
        Capitalize(type.ticketTypeName),
        `${typeTickets.length} / ${type.ticketTypeQuantity}`,
        `${typeChecked}`,
        `${typeRevenue} ${event.currency}`,
      ];
    }),
    foot: [
      [
        t("total"),
        `${tickets.length}`,
        `${checked}`,
        `${revenue} ${event.currency}`,
      ],
    ],
    footStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(46, 50, 55);
  doc.text(
    `${t("checked")}: ${checked}   |   ${t("not_checked")}: ${pending}   |   ${t("returned")}: ${returned}   |   ${t("attendance_rate")}: ${attendanceRate}%`,
    margin,
    y,
  );
  y += 24;
  doc.setTextColor(0, 0, 0);

  // Attendee list
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`${t("attendees")} (${tickets.length})`, margin, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [228, 91, 0], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    head: [
      [
        "#",
        t("ticket_id"),
        t("name"),
        t("email"),
        t("ticket_class"),
        t("status"),
        t("date_purchased"),
      ],
    ],
    body: [...tickets]
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map((ticket, index) => [
        `${index + 1}`,
        ticket.ticketName,
        ticket.fullName,
        ticket.email,
        Capitalize(ticket.ticketType),
        statusLabel(t, ticket.status),
        DateTime.fromISO(String(ticket.createdAt))
          .setZone(sortedDays[0]?.timezone ?? "utc")
          .setLocale(locale)
          .toLocaleString(DateTime.DATE_MED),
      ]),
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        if (data.cell.raw === t("checked")) {
          data.cell.styles.textColor = [52, 156, 46];
        } else if (data.cell.raw === t("returned")) {
          data.cell.styles.textColor = [115, 124, 138];
        } else {
          data.cell.styles.textColor = [234, 150, 28];
        }
      }
    },
  });

  /**
   * CHECKOUT ANSWERS.
   *
   * Its own table rather than extra columns on the attendee list above:
   * with up to ten questions the combined table would be unreadable on A4,
   * and the two are read for different reasons — that one is a door list,
   * this one is what people told you.
   *
   * The columns come from the ANSWERS present, in the order they were
   * asked, so a report only ever carries questions this event actually
   * used. Skipped entirely when nobody answered anything, which is the case
   * for almost every event.
   */
  const answeredTickets = [...tickets]
    .filter((ticket) => (ticket.formAnswers?.length ?? 0) > 0)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  if (answeredTickets.length > 0) {
    // First appearance wins the column order, which is the order the
    // questions were asked in — answers are preloaded in question order.
    const columns: { id: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const ticket of answeredTickets) {
      for (const answer of ticket.formAnswers ?? []) {
        if (seen.has(answer.eventFormQuestionId)) continue;
        seen.add(answer.eventFormQuestionId);
        columns.push({
          id: answer.eventFormQuestionId,
          label: answer.questionLabel,
        });
      }
    }

    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 28;
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${t("answers")} (${answeredTickets.length})`, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [228, 91, 0], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      head: [[t("name"), ...columns.map((column) => column.label)]],
      body: answeredTickets.map((ticket) => {
        const byQuestion = new Map(
          (ticket.formAnswers ?? []).map((answer) => [
            answer.eventFormQuestionId,
            answer.answer,
          ]),
        );
        // A blank cell means the question was optional and skipped, which
        // is itself worth being able to see.
        return [
          ticket.fullName,
          ...columns.map((column) => byQuestion.get(column.id) ?? "—"),
        ];
      }),
    });
  }

  // Page numbers
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

  return doc.output("blob");
}
