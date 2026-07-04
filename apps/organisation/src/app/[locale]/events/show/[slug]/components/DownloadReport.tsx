"use client";
import Capitalize from "@/lib/Capitalize";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import { DocumentDownload } from "iconsax-reactjs";
import { DateTime } from "luxon";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

// Turns the tiptap HTML description into plain text for the PDF.
function stripHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return (parsed.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

// Rasterizes the Ticketwaze wordmark (vector SVG in /public) to a PNG data
// URL, since jsPDF cannot embed SVG directly.
async function loadLogo(): Promise<{
  data: string;
  width: number;
  height: number;
} | null> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = "/logo-horizontal-orange.svg";
  });
  if (!img) return null;
  // 2x the display size in the PDF, for crisp print output
  const width = 600;
  const height = Math.round(width * (172.53 / 893.37));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return { data: canvas.toDataURL("image/png"), width, height };
}

export default function DownloadReport({
  event,
  tickets,
}: {
  event: Event;
  tickets: Ticket[];
}) {
  const t = useTranslations("Events.single_event.report");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const price = (ticket: Ticket) =>
        event.currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice;
      const revenue = tickets.reduce((acc, curr) => acc + price(curr), 0);
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
          : [event.address, event.city, event.country]
              .filter(Boolean)
              .join(", ");

      // Header
      const logo = await loadLogo();
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
      y = (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY + 20;

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
        head: [
          [t("ticket_class"), t("sold"), t("checked"), t("revenue")],
        ],
        body: event.eventTicketTypes.map((type) => {
          const typeTickets = tickets.filter(
            (tk) =>
              tk.ticketType.toLowerCase() ===
              type.ticketTypeName.toLowerCase(),
          );
          const typeRevenue = typeTickets.reduce(
            (acc, curr) => acc + price(curr),
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
      y = (doc as unknown as { lastAutoTable: { finalY: number } })
        .lastAutoTable.finalY + 12;
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
      const statusLabel = (status: Ticket["status"]) => {
        if (status === "CHECKED") return t("checked");
        if (status === "RETURNED") return t("returned");
        return t("not_checked");
      };
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
            statusLabel(ticket.status),
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

      // File name is the activity name only (no id), minus characters that
      // are invalid in file names.
      const fileName =
        event.eventName.replace(/[\\/:*?"<>|]/g, "").trim() || t("title");
      doc.save(`${fileName}.pdf`);
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={
        "font-normal cursor-pointer group text-[1.5rem] border-b border-neutral-200 py-4 leading-8 text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full disabled:opacity-40 disabled:pointer-events-none"
      }
    >
      <span>{loading ? t("generating") : t("button")}</span>
      <DocumentDownload size="20" variant="Bulk" color={"#2E3237"} />
    </button>
  );
}
