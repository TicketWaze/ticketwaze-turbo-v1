/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  MembershipTier,
  Organisation,
  OrganisationSubscription,
} from "@ticketwaze/typescript-config";
import { useLocale, useTranslations } from "next-intl";
import formatDate from "@/lib/FormatDate";
import Separator from "@/components/shared/Separator";
import { TickCircle, CloseCircle } from "iconsax-reactjs";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[0.4rem]">
      <span className="text-[1.1rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
        {label}
      </span>
      <span className="text-[1.5rem] leading-8 text-neutral-900 wrap-break-word">
        {value ?? <span className="text-neutral-400">—</span>}
      </span>
    </div>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-[1.1rem] font-bold uppercase leading-6 text-[#349C2E] bg-[#f5f5f5] px-2 py-[0.3rem] rounded-[30px]">
      <TickCircle size={14} color="#349C2E" variant="Bulk" />
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[1.1rem] font-bold uppercase leading-6 text-neutral-500 bg-[#f5f5f5] px-2 py-[0.3rem] rounded-[30px]">
      <CloseCircle size={14} color="#9ca3af" variant="Bulk" />
      No
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold font-primary text-[1.6rem] leading-8 text-deep-100">
      {children}
    </h3>
  );
}

export default function OrganisationStats({
  organisation,
  membershipTier,
  subscription,
}: {
  organisation: Organisation;
  membershipTier: MembershipTier;
  subscription: OrganisationSubscription | null;
}) {
  const t = useTranslations("Payouts.stats");
  const locale = useLocale();

  const currency = organisation.currency ?? "HTG";

  return (
    <div className="flex flex-col gap-8 overflow-y-auto">
      {/* Profile */}
      <SectionTitle>{t("sections.profile")}</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        <Row label={t("fields.name")} value={organisation.organisationName} />
        <Row label={t("fields.email")} value={organisation.organisationEmail} />
        <Row
          label={t("fields.phone")}
          value={organisation.organisationPhoneNumber}
        />
        <Row
          label={t("fields.website")}
          value={
            organisation.organisationWebsite ? (
              <a
                href={organisation.organisationWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 underline underline-offset-2"
              >
                {organisation.organisationWebsite}
              </a>
            ) : undefined
          }
        />
        <Row
          label={t("fields.location")}
          value={[organisation.city, organisation.state, organisation.country]
            .filter(Boolean)
            .join(", ")}
        />
        <Row label={t("fields.currency")} value={currency} />
      </div>

      <Separator />

      {/* Status & stats */}
      <SectionTitle>{t("sections.status")}</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        <Row
          label={t("fields.verified")}
          value={<BoolBadge value={organisation.isVerified} />}
        />
        <Row
          label={t("fields.published")}
          value={<BoolBadge value={organisation.isPublished} />}
        />
        <Row
          label={t("fields.totalEvents")}
          value={organisation.events?.length ?? 0}
        />
        <Row
          label={t("fields.totalFollowers")}
          value={organisation.followers?.length ?? 0}
        />
        <Row
          label={t("fields.memberSince")}
          value={
            organisation.createdAt
              ? formatDate(organisation.createdAt, locale, "UTC")
              : undefined
          }
        />
      </div>

      <Separator />

      {/* Financials */}
      <SectionTitle>{t("sections.financials")}</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        <Row
          label={t("fields.availableBalance")}
          value={
            <span>
              <span className="font-medium">
                {organisation.availableBalance.toLocaleString()}
              </span>{" "}
              <span className="text-neutral-500 text-[1.3rem]">HTG</span>
            </span>
          }
        />
        <Row
          label={t("fields.pendingBalance")}
          value={
            <span>
              <span className="font-medium">
                {organisation.pendingBalance.toLocaleString()}
              </span>{" "}
              <span className="text-neutral-500 text-[1.3rem]">HTG</span>
            </span>
          }
        />
        <Row
          label={t("fields.availableBalanceUsd")}
          value={
            <span>
              <span className="font-medium">
                {organisation.usdAvailableBalance.toLocaleString()}
              </span>{" "}
              <span className="text-neutral-500 text-[1.3rem]">USD</span>
            </span>
          }
        />
        <Row
          label={t("fields.pendingBalanceUsd")}
          value={
            <span>
              <span className="font-medium">
                {organisation.usdPendingBalance.toLocaleString()}
              </span>{" "}
              <span className="text-neutral-500 text-[1.3rem]">USD</span>
            </span>
          }
        />
      </div>

      <Separator />

      {/* Banking */}
      <SectionTitle>{t("sections.banking")}</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        <Row label={t("fields.bankName")} value={organisation.bankName} />
        <Row
          label={t("fields.accountName")}
          value={organisation.bankAccountName}
        />
        <Row
          label={t("fields.accountNumber")}
          value={organisation.bankAccountNumber}
        />
      </div>

      <Separator />

      {/* Mobile money */}
      <SectionTitle>{t("sections.mobileMoney")}</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        <Row
          label={t("fields.moncashName")}
          value={organisation.moncashAccountName}
        />
        <Row
          label={t("fields.moncashNumber")}
          value={organisation.moncashNumber}
        />
        <Row
          label={t("fields.natcashName")}
          value={organisation.natcashAccountName}
        />
        <Row
          label={t("fields.natcashNumber")}
          value={organisation.natcashNumber}
        />
      </div>

      {/* Social links */}
      {organisation.socialLinks &&
        Object.keys(organisation.socialLinks).length > 0 && (
          <>
            <Separator />
            <SectionTitle>{t("sections.social")}</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(organisation.socialLinks).map(
                ([platform, url]) =>
                  url ? (
                    <Row
                      key={platform}
                      label={platform}
                      value={
                        <a
                          href={String(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 underline underline-offset-2"
                        >
                          {String(url)}
                        </a>
                      }
                    />
                  ) : null,
              )}
            </div>
          </>
        )}

      <Separator />

      {/* Membership tier */}
      <SectionTitle>{t("sections.membership")}</SectionTitle>
      {membershipTier ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
            <Row
              label={t("fields.plan")}
              value={
                <span className="flex items-center gap-3">
                  <span className="font-semibold text-primary-500">
                    {membershipTier.membershipName}
                  </span>
                  {!subscription ? (
                    <span className="text-[1.1rem] font-bold uppercase leading-6 text-neutral-500 bg-neutral-100 px-2 py-[0.3rem] rounded-[30px]">
                      {t("subscription.free")}
                    </span>
                  ) : subscription.isTrial ? (
                    <span className="text-[1.1rem] font-bold uppercase leading-6 text-[#EA961C] bg-[#FEF3E2] px-2 py-[0.3rem] rounded-[30px]">
                      {t("subscription.trial")}
                    </span>
                  ) : null}
                </span>
              }
            />
            {subscription && !subscription.isTrial && (
              <Row
                label={t("fields.planPrice")}
                value={
                  <span>
                    <span className="font-medium">
                      {membershipTier.membershipPrice.toLocaleString()}
                    </span>{" "}
                    <span className="text-neutral-500 text-[1.3rem]">HTG</span>
                    {membershipTier.membershipUsdPrice > 0 && (
                      <span className="text-neutral-400 text-[1.3rem] ml-4">
                        / {membershipTier.membershipUsdPrice.toLocaleString()}{" "}
                        USD
                      </span>
                    )}
                  </span>
                }
              />
            )}
            <Row
              label={t("fields.teamMembers")}
              value={membershipTier.teamMember}
            />
            <Row
              label={t("fields.freeTickets")}
              value={membershipTier.freeTickets}
            />
            {membershipTier.membershipDescription && (
              <Row
                label={t("fields.planDescription")}
                value={membershipTier.membershipDescription}
              />
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {(
              [
                ["fields.emailSupport", membershipTier.emailSupport],
                ["fields.customTickets", membershipTier.customTicketTypes],
                ["fields.discountCodes", membershipTier.discountCodes],
                ["fields.prioritySupport", membershipTier.prioritySupport],
                ["fields.aiFeatures", membershipTier.aiFeatures],
                ["fields.earlyAccess", membershipTier.earlyAccess],
                ["fields.verifiedBadge", membershipTier.verifiedBadge],
                ["fields.customBranding", membershipTier.customBranding],
                ["fields.apiAccess", membershipTier.apiAccess],
                [
                  "fields.accountManager",
                  membershipTier.dedicatedAccountManager,
                ],
              ] as [string, boolean][]
            ).map(([key, enabled]) => (
              <div
                key={key}
                className={`flex items-center gap-3 px-4 py-3 rounded-[.8rem] ${enabled ? "bg-[#f0faf0]" : "bg-neutral-100"}`}
              >
                {enabled ? (
                  <TickCircle size={16} color="#349C2E" variant="Bulk" />
                ) : (
                  <CloseCircle size={16} color="#9ca3af" variant="Bulk" />
                )}
                <span
                  className={`text-[1.3rem] leading-6 ${enabled ? "text-neutral-900" : "text-neutral-400"}`}
                >
                  {t(key as any)}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[1.5rem] text-neutral-400">—</p>
      )}
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
