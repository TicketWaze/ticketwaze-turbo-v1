"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatMoney } from "@ticketwaze/currency";
import { AdminOrganisation } from "@ticketwaze/typescript-config";
import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import Separator from "@/components/shared/Separator";
import SuspensionNotice from "@/components/shared/SuspensionNotice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import ActivitySummary, { type ActivityCardData } from "./ActivitySummary";
import ProfileActions from "./ProfileActions";
import {
  LogoCard,
  OrganisationProfile,
  OrganizerInformation,
  type OrganisationFields,
} from "./ProfileDetails";

export type OrganisationSummary = {
  ticketsSold: number;
  revenue: { htg: number; usd: number };
  profit: { htg: number; usd: number };
  activities: ActivityCardData[];
};

export type OrganisationOwner = {
  userId: string;
  email: string;
  phone: string | null;
  appLanguage: string | null;
};

function fieldsOf(organisation: AdminOrganisation): OrganisationFields {
  const o = organisation as AdminOrganisation & { address?: string | null };
  return {
    organisationName: organisation.organisationName ?? "",
    address: o.address ?? "",
    country: organisation.country || "",
    state: organisation.state ?? "",
    city: organisation.city ?? "",
    organisationDescription: organisation.organisationDescription ?? "",
    organisationPhoneNumber: organisation.organisationPhoneNumber ?? "",
    organisationWebsite: organisation.organisationWebsite ?? "",
  };
}

/**
 * Figma "Admin" → Organizers → User Profile (4262:75668 Event Summary,
 * 4262:76509 Finance): Suspend account / Edit profile in the header,
 * Organization Profile (editable on Edit) and Organizer Information (the
 * owner's account, read-only), and the Event Summary / Finance tabs. Kept from
 * before: the logo card, the suspension notice, the Subscription card, and the
 * subscription / verification / KYC actions (⋯).
 */
export default function UserPageContent({
  organisation,
  summary,
  owner,
}: {
  organisation: AdminOrganisation | null;
  summary: OrganisationSummary | null;
  owner: OrganisationOwner | null;
}) {
  const t = useTranslations("Organisations.profile");
  const router = useRouter();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(() => (organisation ? fieldsOf(organisation) : null));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<Partial<Record<keyof OrganisationFields, string>>>({});

  if (!organisation || !saved || !draft) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-[1.6rem] text-neutral-600">{t("not_found")}</p>
        </div>
      </AdminLayout>
    );
  }

  async function save() {
    if (!draft || !organisation) return;
    const found: typeof errors = {};
    const name = draft.organisationName.trim();
    if (name.length < 3 || name.length > 30) found.organisationName = t("errors.name");
    if (draft.organisationDescription.trim().length > 350)
      found.organisationDescription = t("errors.about");
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/organisations/${organisation.organisationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        body: JSON.stringify({
          organisationName: name,
          organisationDescription: draft.organisationDescription.trim(),
          address: draft.address.trim() || null,
          country: draft.country || undefined,
          state: draft.state || undefined,
          city: draft.city || undefined,
          organisationPhoneNumber: draft.organisationPhoneNumber.trim(),
          organisationWebsite: draft.organisationWebsite.trim() || null,
        }),
      },
    ).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSaving(false);
    if (data?.status === "success") {
      setSaved(draft);
      setEditing(false);
      toast.success(t("edit.saved"));
      router.refresh();
    } else if (data?.code === "NAME_TAKEN") {
      setErrors({ organisationName: t("errors.name_taken") });
    } else {
      toast.error(t("edit.failed"));
    }
  }

  return (
    <AdminLayout>
      <div className={PAGE_SCROLLER}>
        <BackButton text={t("back")} />
        <div className="sticky top-0 z-20 bg-white pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h2>
          <ProfileActions
            organisationId={organisation.organisationId}
            isSuspended={organisation.isSuspended}
            isVerified={organisation.isVerified}
            editing={editing}
            saving={saving}
            onEdit={() => setEditing(true)}
            onCancel={() => {
              setDraft(saved);
              setErrors({});
              setEditing(false);
            }}
            onSave={save}
          />
        </div>

        {/* An active suspension explains everything else on this page — the
            missing events, the frozen balance — so it is stated up front. */}
        {organisation.suspension && <SuspensionNotice suspension={organisation.suspension} />}

        <div className="w-full grid grid-cols-1 lg:grid-cols-[15fr_21fr] gap-8 lg:gap-16">
          <div className="w-full min-w-0 flex flex-col gap-12 pb-4">
            <LogoCard
              organisationId={organisation.organisationId}
              name={saved.organisationName}
              isVerified={organisation.isVerified}
              imageUrl={organisation.profileImageUrl ?? null}
              canEdit={can("organisations.edit")}
            />
            <OrganisationProfile
              email={organisation.organisationEmail}
              value={draft}
              onChange={(next) => {
                setDraft(next);
                setErrors({});
              }}
              editing={editing}
              errors={errors}
            />
            {owner && (
              <OrganizerInformation
                email={owner.email}
                phone={owner.phone}
                appLanguage={owner.appLanguage}
              />
            )}
            <SubscriptionCard subscription={organisation.subscription ?? null} />
          </div>

          <div className="min-w-0 lg:min-h-[75vh]">
            <Tabs defaultValue="summary" className="w-full h-full">
              <TabsList className="w-full min-w-0 lg:w-fit mx-auto lg:mx-0 mb-8">
                <TabsTrigger value="summary" className="whitespace-normal lg:whitespace-nowrap">
                  {t("summary.title")}
                </TabsTrigger>
                <TabsTrigger value="finance" className="whitespace-normal lg:whitespace-nowrap">
                  {t("finance.title")}
                </TabsTrigger>
              </TabsList>
              <ActivitySummary
                activities={summary?.activities ?? []}
                createdAt={organisation.createdAt}
              />
              <Finance organisation={organisation} summary={summary} />
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex justify-between gap-8">
      <span className="text-[1.5rem] text-neutral-600 leading-8 shrink-0" title={hint}>
        {label}
      </span>
      <span className="text-[1.5rem] text-deep-100 font-medium leading-8 text-right">
        {children}
      </span>
    </li>
  );
}

/**
 * Figma "Finance": tickets sold, revenue (what buyers paid), profit (what the
 * organisation kept), then the balance. Revenue and profit in HTG with USD
 * under them; the balance in the organisation's own currency, with the
 * pending amount as a small line beneath it.
 */
function Finance({
  organisation,
  summary,
}: {
  organisation: AdminOrganisation;
  summary: OrganisationSummary | null;
}) {
  const t = useTranslations("Organisations.profile.finance");
  const locale = useLocale();
  const usd = organisation.currency === "USD";
  const currency = usd ? "USD" : "HTG";
  const available = usd ? organisation.usdAvailableBalance : organisation.availableBalance;
  const pending = usd ? organisation.usdPendingBalance : organisation.pendingBalance;
  const pair = (value: { htg: number; usd: number } | undefined) => (
    <>
      {formatMoney(value?.htg ?? 0, "HTG", locale)}
      <span className="block text-[1.2rem] font-normal text-neutral-500">
        {formatMoney(value?.usd ?? 0, "USD", locale)}
      </span>
    </>
  );
  return (
    <TabsContent value="finance">
      <ul className="flex flex-col gap-8 pt-2">
        <Row label={t("total_ticket_sold")}>
          {(summary?.ticketsSold ?? 0).toLocaleString(locale)}
        </Row>
        <Row label={t("total_revenue")} hint={t("revenue_hint")}>
          {pair(summary?.revenue)}
        </Row>
        <Row label={t("total_profit")} hint={t("profit_hint")}>
          {pair(summary?.profit)}
        </Row>
        <Separator />
        <Row label={t("balance")}>
          {formatMoney(Number(available ?? 0), currency, locale)}
          {Number(pending ?? 0) > 0 && (
            <span className="block text-[1.2rem] font-normal text-neutral-500">
              {t("pending", { amount: formatMoney(Number(pending), currency, locale) })}
            </span>
          )}
        </Row>
      </ul>
    </TabsContent>
  );
}

/**
 * Not in Figma; kept from before. The API returns only the subscription that
 * actually entitles the organisation (SubscriptionHelper), so its presence IS
 * the answer — a cancelled plan still paid up through its period counts.
 */
function SubscriptionCard({
  subscription: sub,
}: {
  subscription: AdminOrganisation["subscription"] | null;
}) {
  const t = useTranslations("Organisations.profile.subscription");
  const locale = useLocale();
  const badge = !sub
    ? null
    : sub.paymentMethod === "complimentary"
      ? { label: t("complimentary"), className: "text-primary-500 bg-primary-50" }
      : sub.isTrial
        ? { label: t("trial"), className: "text-[#EA961C] bg-[#FEF3E2]" }
        : { label: t("active"), className: "text-success bg-success/10" };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-deep-100 font-primary font-medium text-[1.8rem] leading-10">
        {t("title")}
      </h3>
      <ul className="flex flex-col gap-6 border border-neutral-100 rounded-[20px] p-6">
        <Row label={t("plan")}>
          <span className="inline-flex items-center gap-3">
            <span className="capitalize">{sub ? sub.membershipTier : t("free")}</span>
            {badge && (
              <span
                className={cn(
                  "text-[1.1rem] font-bold uppercase leading-6 px-2 py-[0.3rem] rounded-[30px]",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            )}
          </span>
        </Row>
        {sub ? (
          <>
            {!sub.isTrial && <Row label={t("billing")}>{t(sub.billingCycle)}</Row>}
            <Row label={t("started")}>
              {formatDate(sub.createdAt as unknown as string, locale, "local")}
            </Row>
            <Row label={t("expires")}>
              {formatDate(sub.endsAt as unknown as string, locale, "local")}
            </Row>
            <Row label={t("method")}>
              <span className="capitalize">{sub.paymentMethod}</span>
            </Row>
          </>
        ) : (
          <li className="text-[1.4rem] text-neutral-500 leading-7">{t("none")}</li>
        )}
      </ul>
    </div>
  );
}
