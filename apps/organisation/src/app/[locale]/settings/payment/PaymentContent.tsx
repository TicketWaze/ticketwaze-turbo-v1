"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Sms } from "iconsax-reactjs";
import { Organisation } from "@ticketwaze/typescript-config";
import { Input } from "@/components/shared/Inputs";
import { ButtonPill } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import CreatePinDialog from "@/components/shared/CreatePinDialog";
import {
  ChangeWithdrawalPin,
  UpdateOrganisationBankPaymentInformation,
  UpdateOrganisationMoncashPaymentInformation,
  UpdateOrganisationNatcashPaymentInformation,
} from "@/actions/organisationActions";
import { SettingsColumn, SettingsHeader } from "../parts";

type Details = {
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  moncashAccountName: string;
  moncashNumber: string;
  natcashAccountName: string;
  natcashNumber: string;
};

function maskEmail(email: string | null | undefined) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

/**
 * Payment (Figma 1832:49200 view / 1836:49597 edit): "Withdrawal Account" —
 * the bank details Figma shows, plus the MonCash and NatCash accounts the
 * withdrawal flow also pre-fills from — read-only until Edit. The header
 * offers "Create withdrawal pin" (popup, 1836:49812) or "Change withdrawal
 * pin", which emails a reset link and shows Reset Withdrawal Pin (1836:50310).
 */
export default function PaymentContent({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.payment");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const initial: Details = {
    bankName: organisation.bankName ?? "",
    bankAccountNumber: organisation.bankAccountNumber ?? "",
    bankAccountName: organisation.bankAccountName ?? "",
    moncashAccountName: organisation.moncashAccountName ?? "",
    moncashNumber: organisation.moncashNumber ?? "",
    natcashAccountName: organisation.natcashAccountName ?? "",
    natcashNumber: organisation.natcashNumber ?? "",
  };
  const [saved, setSaved] = useState(initial);
  const [data, setData] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasPin, setHasPin] = useState(Boolean(organisation.hasWithdrawalPin));
  const [pinOpen, setPinOpen] = useState(searchParams.get("action") === "pin");
  const [resetSent, setResetSent] = useState(false);
  const [sending, setSending] = useState(false);
  const set =
    (field: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((d) => ({ ...d, [field]: e.target.value }));
  const digits =
    (field: keyof Details) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((d) => ({
        ...d,
        [field]: e.target.value.replace(/\D/g, "").slice(0, 8),
      }));

  const changed = (keys: (keyof Details)[]) =>
    keys.some((k) => data[k] !== saved[k]);

  async function save() {
    const bank = ["bankName", "bankAccountNumber", "bankAccountName"] as const;
    const moncash = ["moncashAccountName", "moncashNumber"] as const;
    const natcash = ["natcashAccountName", "natcashNumber"] as const;
    // A wallet is either complete or left empty; a number is 8 digits.
    const partial = (keys: readonly (keyof Details)[]) =>
      keys.some((k) => data[k].trim()) && !keys.every((k) => data[k].trim());
    if (partial(bank)) return toast.error(t("errors.bank_incomplete"));
    if (
      partial(moncash) ||
      (data.moncashNumber && !/^\d{8}$/.test(data.moncashNumber))
    )
      return toast.error(t("errors.moncash_invalid"));
    if (
      partial(natcash) ||
      (data.natcashNumber && !/^\d{8}$/.test(data.natcashNumber))
    )
      return toast.error(t("errors.natcash_invalid"));

    setSaving(true);
    const results = await Promise.all([
      changed([...bank]) && data.bankName.trim()
        ? UpdateOrganisationBankPaymentInformation(
            organisation.organisationId,
            {
              bankName: data.bankName.trim(),
              bankAccountName: data.bankAccountName.trim(),
              bankAccountNumber: data.bankAccountNumber.trim(),
            },
            locale,
          )
        : null,
      changed([...moncash]) && data.moncashNumber
        ? UpdateOrganisationMoncashPaymentInformation(
            organisation.organisationId,
            {
              moncashAccountName: data.moncashAccountName.trim(),
              moncashNumber: data.moncashNumber,
            },
            locale,
          )
        : null,
      changed([...natcash]) && data.natcashNumber
        ? UpdateOrganisationNatcashPaymentInformation(
            organisation.organisationId,
            {
              natcashAccountName: data.natcashAccountName.trim(),
              natcashNumber: data.natcashNumber,
            },
            locale,
          )
        : null,
    ]);
    setSaving(false);
    const failed = results.find((r) => r && r.status !== "success") as
      | { error?: string }
      | undefined;
    if (failed) return toast.error(failed.error ?? t("errors.save"));
    toast.success(t("saved"));
    setSaved(data);
    setEditing(false);
    if (redirectTo) router.push(`/${locale}${redirectTo}`);
  }

  async function requestReset() {
    setSending(true);
    const result = await ChangeWithdrawalPin(
      organisation.organisationId,
      locale,
    );
    setSending(false);
    if (result.status === "success") {
      setResetSent(true);
      return;
    }
    if (result.status === "waiting") {
      const diff = new Date(result.nextAllowedAt).getTime() - Date.now();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.max(1, Math.ceil((diff % 3_600_000) / 60_000));
      toast.info(`${t("newRequest")} ${h > 0 ? `${h}h ` : ""}${m}m`);
      setResetSent(true);
      return;
    }
    toast.error(result.error);
  }

  /* ── Reset Withdrawal Pin (Figma 1836:50310) ── */
  if (resetSent) {
    return (
      <div className="flex flex-col gap-12 pb-16 h-full">
        <SettingsHeader
          title={t("change_pin_title")}
          backHref="/settings/payment"
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center py-10">
          <motion.div
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="w-[10rem] h-[10rem] rounded-[2.4rem] bg-gradient-to-b from-[#FFB27D] to-[#FF7A2F] flex items-center justify-center shadow-[0_14px_30px_rgba(228,91,0,0.25)]"
          >
            <Sms size="52" variant="Bulk" color="#ffffff" />
          </motion.div>
          <h2 className="font-primary font-medium text-[2.4rem] lg:text-[2.8rem] leading-tight text-black">
            {t("reset_title")}
          </h2>
          <p className="max-w-[44rem] text-[1.5rem] leading-[2.4rem] text-neutral-600">
            {t("reset_description", {
              email: maskEmail(organisation.organisationEmail),
            })}
          </p>
          <div className="flex items-center gap-4 rounded-[10rem] border border-neutral-100 pl-6 pr-2 py-2">
            <span className="text-[1.4rem] text-neutral-600">
              {t("no_mail")}
            </span>
            <button
              type="button"
              onClick={requestReset}
              disabled={sending}
              className="h-[4rem] min-w-[9rem] px-6 rounded-[10rem] border-2 border-primary-500 bg-primary-50 text-primary-500 text-[1.4rem] font-medium cursor-pointer disabled:opacity-60 flex items-center justify-center"
            >
              {sending ? <LoadingCircleSmall /> : t("resend")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const off = !editing || saving;
  const card = (title: string, body: React.ReactNode) => (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-neutral-100 p-6">
      <h3 className="font-sans font-semibold text-[1.6rem] text-deep-100">
        {title}
      </h3>
      {body}
    </div>
  );

  return (
    <div className="flex flex-col gap-12 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader
        title={t("title")}
        actions={
          <>
            {hasPin ? (
              <ButtonPill
                onClick={requestReset}
                disabled={sending}
                className="border-primary-500 bg-primary-50 text-primary-500 hover:bg-primary-100 hover:text-primary-600"
              >
                {sending ? <LoadingCircleSmall /> : t("change_pin")}
              </ButtonPill>
            ) : (
              <ButtonPill
                onClick={() => setPinOpen(true)}
                className="border-primary-500 bg-primary-50 text-primary-500 hover:bg-primary-100 hover:text-primary-600"
              >
                {t("create_pin")}
              </ButtonPill>
            )}
            {editing ? (
              <>
                <ButtonPill
                  onClick={() => {
                    setData(saved);
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  {t("cancel")}
                </ButtonPill>
                <ButtonPill
                  tone="primary"
                  onClick={save}
                  disabled={saving}
                  className="min-w-[13rem]"
                >
                  {saving ? <LoadingCircleSmall /> : t("save")}
                </ButtonPill>
              </>
            ) : (
              <ButtonPill
                tone="primary"
                onClick={() => setEditing(true)}
                className="px-8"
              >
                {t("edit")}
              </ButtonPill>
            )}
          </>
        }
      />

      <SettingsColumn title={t("subtitle")}>
        {card(
          t("bank"),
          <>
            <Input
              value={data.bankName}
              onChange={set("bankName")}
              disabled={off}
            >
              {t("bank_name")}
            </Input>
            <Input
              value={data.bankAccountNumber}
              onChange={set("bankAccountNumber")}
              disabled={off}
            >
              {t("bank_account_number")}
            </Input>
            <Input
              value={data.bankAccountName}
              onChange={set("bankAccountName")}
              disabled={off}
            >
              {t("bank_account_name")}
            </Input>
          </>,
        )}
        {card(
          t("moncash"),
          <>
            <Input
              value={data.moncashAccountName}
              onChange={set("moncashAccountName")}
              disabled={off}
            >
              {t("holder_name")}
            </Input>
            <Input
              value={data.moncashNumber}
              onChange={digits("moncashNumber")}
              disabled={off}
              inputMode="numeric"
            >
              {t("wallet_number")}
            </Input>
          </>,
        )}
        {card(
          t("natcash"),
          <>
            <Input
              value={data.natcashAccountName}
              onChange={set("natcashAccountName")}
              disabled={off}
            >
              {t("holder_name")}
            </Input>
            <Input
              value={data.natcashNumber}
              onChange={digits("natcashNumber")}
              disabled={off}
              inputMode="numeric"
            >
              {t("wallet_number")}
            </Input>
          </>,
        )}
      </SettingsColumn>

      <CreatePinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        organisationId={organisation.organisationId}
        onCreated={() => {
          setHasPin(true);
          setPinOpen(false);
          if (redirectTo) router.push(`/${locale}${redirectTo}`);
        }}
      />
    </div>
  );
}
