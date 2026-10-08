"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { DocumentText, ExportSquare, InfoCircle } from "iconsax-reactjs";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import { Reveal } from "@/components/shared/motion";
import { CARD, HEADER_PILL, PILL_TONE } from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import KycStatusPill from "@/components/kyc/KycStatusPill";
import formatDate from "@/lib/FormatDate";
import { ApproveKycAction } from "@/actions/Kyc";
import { RejectKycDialog } from "./RejectKycDialog";

interface KycFile {
  fileId: string;
  kind: string;
  fileName: string;
  mimeType: string;
  /** Null when the private bucket isn't configured on this environment. */
  url: string | null;
}

interface KycSubmission {
  verificationId: string;
  organisationType: string;
  idDocumentType: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  files: KycFile[];
}

export interface KycReviewData {
  organisation: {
    organisationId: string;
    organisationName: string;
    organisationEmail: string;
    organisationPhoneNumber: string;
    profileImageUrl: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    kycStatus: string;
    owner: { name: string; email: string } | null;
  };
  submissions: KycSubmission[];
}

// Order the reviewer reads in: identity first, then the organisation papers.
const KIND_ORDER = [
  "id_front",
  "id_back",
  "selfie",
  "business_registration",
  "tax_id",
  "authority_proof",
  "ngo_registration",
  "statutes",
  "board_letter",
  "official_letter",
];

export default function KycReviewContent({ data }: { data: KycReviewData }) {
  const t = useTranslations("Kyc");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [approving, setApproving] = useState(false);
  const { organisation, submissions } = data;
  const [current, ...history] = submissions;

  async function approve() {
    if (!current) return;
    setApproving(true);
    const result = await ApproveKycAction(
      current.verificationId,
      organisation.organisationId,
      session?.user.accessToken ?? "",
      locale,
    );
    setApproving(false);
    if ("status" in result) {
      toast.success(t("review.approved"));
      router.refresh();
    } else toast.error(result.error ?? t("review.error"));
  }

  const location = [organisation.address, organisation.city, organisation.state, organisation.country]
    .filter(Boolean)
    .join(", ");

  return (
    <AdminLayout>
      <div className={cn(PAGE_SCROLLER, "gap-0")}>
        <SettingsHeader
          title={organisation.organisationName}
          back={{ href: "/kyc", label: t("review.back") }}
          actions={
            current?.status === "pending" ? (
              <div className="flex items-center gap-[1rem] w-full lg:w-auto">
                <RejectKycDialog
                  verificationId={current.verificationId}
                  organisationId={organisation.organisationId}
                />
                <button
                  type="button"
                  onClick={approve}
                  disabled={approving}
                  className={cn(HEADER_PILL, PILL_TONE.primary)}
                >
                  {approving ? <LoadingCircleSmall /> : t("review.approve")}
                </button>
              </div>
            ) : (
              <KycStatusPill status={organisation.kycStatus} />
            )
          }
        />

        <Reveal className={cn(CARD, "grid grid-cols-1 lg:grid-cols-3 gap-8")}>
          <Info label={t("review.owner")}>
            {organisation.owner ? (
              <>
                <span>{organisation.owner.name}</span>
                <span className="text-neutral-500">{organisation.owner.email}</span>
              </>
            ) : (
              "—"
            )}
          </Info>
          <Info label={t("review.contact")}>
            <span>{organisation.organisationEmail}</span>
            <span className="text-neutral-500">{organisation.organisationPhoneNumber}</span>
          </Info>
          <Info label={t("review.location")}>{location || "—"}</Info>
        </Reveal>

        {!current ? (
          <p className="text-[1.6rem] text-neutral-600 py-10 text-center">
            {t("review.none")}
          </p>
        ) : (
          <Reveal as="section" delay={0.05} className="flex flex-col gap-8 pt-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h4 className="font-primary font-medium text-[1.8rem] text-black">
                  {t("review.current")}
                </h4>
                <p className="text-[1.4rem] text-neutral-600">
                  {t(`types.${current.organisationType}`)} ·{" "}
                  {t(`documents.${current.idDocumentType}`)} ·{" "}
                  {t("review.submitted_on", {
                    date: formatDate(current.createdAt, locale, "local"),
                  })}
                </p>
              </div>
              <KycStatusPill status={current.status} />
            </div>

            {current.status === "pending" && (
              <p className="flex gap-3 items-start text-[1.4rem] text-neutral-700 bg-neutral-100 rounded-[1.5rem] p-5">
                <InfoCircle size={20} variant="Bulk" color="#737C8A" className="shrink-0" />
                {t("review.checklist")}
              </p>
            )}
            {current.rejectionReason && (
              <p className="text-[1.4rem] text-failure">
                {t("review.reason", { reason: current.rejectionReason })}
              </p>
            )}

            <FileGrid files={current.files} />
            <p className="text-[1.2rem] text-neutral-500">{t("review.links_expire")}</p>
          </Reveal>
        )}

        {history.length > 0 && (
          <section className="flex flex-col gap-6 border-t-2 border-neutral-100 mt-12 pt-12 pb-10">
            <h4 className="font-primary font-medium text-[1.8rem] text-black">
              {t("review.history")}
            </h4>
            {history.map((s) => (
              <details
                key={s.verificationId}
                className="rounded-[1.5rem] border border-neutral-100 p-6 group"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                  <span className="text-[1.4rem] text-neutral-700">
                    {t(`types.${s.organisationType}`)} ·{" "}
                    {t("review.submitted_on", {
                      date: formatDate(s.createdAt, locale, "local"),
                    })}
                  </span>
                  <KycStatusPill status={s.status} />
                </summary>
                <div className="flex flex-col gap-4 pt-6">
                  {s.rejectionReason && (
                    <p className="text-[1.4rem] text-failure">
                      {t("review.reason", { reason: s.rejectionReason })}
                    </p>
                  )}
                  <FileGrid files={s.files} />
                </div>
              </details>
            ))}
          </section>
        )}
      </div>
    </AdminLayout>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[1.3rem] text-neutral-600">{label}</span>
      <span className="flex flex-col text-[1.5rem] text-deep-100 break-words">{children}</span>
    </div>
  );
}

function FileGrid({ files }: { files: KycFile[] }) {
  const t = useTranslations("Kyc");
  const sorted = [...files].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {sorted.map((file) => (
        <a
          key={file.fileId}
          href={file.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!file.url}
          className="group flex flex-col rounded-[1.5rem] border border-neutral-100 overflow-hidden hover:border-primary-300 transition-colors aria-disabled:pointer-events-none"
        >
          <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center overflow-hidden">
            {file.url && file.mimeType.startsWith("image/") ? (
              // Signed S3 links: next/image can't optimise them.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt={t(`kinds.${file.kind}`)}
                className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
              />
            ) : (
              <DocumentText size={56} variant="Bulk" color="#E45B00" />
            )}
          </div>
          <div className="flex items-center justify-between gap-3 p-5">
            <span className="flex flex-col min-w-0">
              <span className="text-[1.4rem] font-medium text-deep-100 truncate">
                {t(`kinds.${file.kind}`)}
              </span>
              <span className="text-[1.2rem] text-neutral-500 truncate">
                {file.fileName}
              </span>
            </span>
            <ExportSquare size={18} color="#737C8A" className="shrink-0" />
          </div>
        </a>
      ))}
    </div>
  );
}
