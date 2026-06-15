"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import formatDate from "@/lib/FormatDate";
import PageLoader from "@/components/PageLoader";

export type ContactMessage = {
  contactMessageId: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  resolved: boolean;
  supportNotes: string | null;
  appLanguage: string;
  createdAt: string;
  updatedAt: string;
};

type Meta = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string | null;
  lastPageUrl: string | null;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
};

export type ContactMessagesResponse = {
  data: ContactMessage[];
  meta: Meta;
};

export default function ContactPageContent({
  messages,
  resolved,
}: {
  messages: ContactMessagesResponse;
  resolved: string;
  accessToken: string;
}) {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [resolved, messages]);

  const { meta } = messages;
  const currentPage = meta.currentPage;
  const hasPrev = currentPage > meta.firstPage;
  const hasNext = currentPage < meta.lastPage;

  const getPageNumbers = () => {
    const range: number[] = [];
    const delta = 2;
    const left = Math.max(meta.firstPage, currentPage - delta);
    const right = Math.min(meta.lastPage, currentPage + delta);
    for (let i = left; i <= right; i++) range.push(i);
    return range;
  };

  function buildPageHref(page: number) {
    return `/contact?page=${page}&resolved=${resolved}`;
  }

  function handleTabChange(value: string) {
    setIsLoading(true);
    router.push(`/contact?page=1&resolved=${value}`);
  }

  function openMessage(id: string) {
    setIsLoading(true);
    router.push(`/contact/${id}`);
  }

  return (
    <AdminLayout>
      <div className="overflow-y-scroll flex flex-col gap-8">
        <PageLoader isLoading={isLoading} />

        {/* Topbar */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h3>

          {/* Open / Resolved toggle */}
          <div className="flex bg-neutral-100 rounded-[3rem] p-1 gap-1">
            <button
              onClick={() => resolved !== "false" && handleTabChange("false")}
              className={`px-6 py-[0.5rem] rounded-[3rem] text-[1.4rem] transition-colors cursor-pointer ${
                resolved === "false"
                  ? "bg-white text-primary-500 font-medium shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {t("filters.open")}
            </button>
            <button
              onClick={() => resolved !== "true" && handleTabChange("true")}
              className={`px-6 py-[0.5rem] rounded-[3rem] text-[1.4rem] transition-colors cursor-pointer ${
                resolved === "true"
                  ? "bg-white text-[#349C2E] font-medium shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {t("filters.resolved")}
            </button>
          </div>
        </div>

        {/* Table */}
        <Table id="contact-table">
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.sender")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.subject")}
              </TableHead>
              <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.status")}
              </TableHead>
              <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
                {t("table.date")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.data.map((msg) => (
              <TableRow
                key={msg.contactMessageId}
                onClick={() => openMessage(msg.contactMessageId)}
                className="cursor-pointer"
              >
                <TableCell className="py-6">
                  <p className="text-[1.5rem] leading-8 text-neutral-900 font-medium">
                    {msg.fullName}
                  </p>
                  <p className="text-[1.3rem] leading-6 text-neutral-500">
                    {msg.email}
                  </p>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900 py-6">
                  {msg.subject}
                </TableCell>
                <TableCell className="py-6">
                  {msg.resolved ? (
                    <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#349C2E] px-2 rounded-[30px] bg-[#f5f5f5]">
                      {t("status.resolved")}
                    </span>
                  ) : (
                    <span className="py-[0.3rem] text-[1.1rem] font-bold leading-6 uppercase text-[#EA961C] px-2 rounded-[30px] bg-[#f5f5f5]">
                      {t("status.open")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900">
                  {formatDate(msg.createdAt, locale, "local")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {messages.data.length === 0 && (
          <div className="flex flex-col items-center mt-8 gap-4 self-center">
            <p className="w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
              {t("empty")}
            </p>
          </div>
        )}

        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex items-center gap-2 pb-4">
            {hasPrev ? (
              <Link
                href={buildPageHref(currentPage - 1)}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
              </Link>
            ) : (
              <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
                <ArrowLeft2 size="20" color="#E45B00" variant="Bulk" />
              </span>
            )}

            {getPageNumbers()[0] > meta.firstPage && (
              <>
                <Link
                  href={buildPageHref(meta.firstPage)}
                  className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  {meta.firstPage}
                </Link>
                {getPageNumbers()[0] > meta.firstPage + 1 && (
                  <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
                )}
              </>
            )}

            {getPageNumbers().map((page) => (
              <Link
                key={page}
                href={buildPageHref(page)}
                className={`w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium transition-colors ${
                  page === currentPage
                    ? "text-primary-500 pointer-events-none"
                    : "text-neutral-600 hover:text-primary-500"
                }`}
              >
                {page}
              </Link>
            ))}

            {getPageNumbers().at(-1)! < meta.lastPage && (
              <>
                {getPageNumbers().at(-1)! < meta.lastPage - 1 && (
                  <span className="text-[1.3rem] text-neutral-400 px-1">…</span>
                )}
                <Link
                  href={buildPageHref(meta.lastPage)}
                  className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full text-[1.3rem] font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  {meta.lastPage}
                </Link>
              </>
            )}

            {hasNext ? (
              <Link
                href={buildPageHref(currentPage + 1)}
                className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
              >
                <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
              </Link>
            ) : (
              <span className="w-[3.6rem] h-[3.6rem] flex items-center justify-center rounded-full opacity-30 cursor-not-allowed">
                <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
              </span>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
