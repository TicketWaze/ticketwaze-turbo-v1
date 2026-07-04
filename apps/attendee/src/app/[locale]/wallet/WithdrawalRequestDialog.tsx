"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowUp } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CreateUserWithdrawalRequestAction } from "@/actions/userActions";

type AccountType = "bank" | "moncash";
type Currency = "HTG" | "USD";

const MIN_AMOUNT: Record<Currency, number> = { HTG: 1000, USD: 10 };

interface FormState {
  accountType: AccountType;
  currency: Currency;
  bankName: string;
  accountName: string;
  accountNumber: string;
  amount: string;
}

export default function WithdrawalRequestDialog({
  htgAvailableBalance,
  usdAvailableBalance,
}: {
  htgAvailableBalance: number;
  usdAvailableBalance: number;
}) {
  const { data: session } = useSession();
  const t = useTranslations("Wallet.withdrawal.dialog");
  const tw = useTranslations("Wallet.withdrawal");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    accountType: "bank",
    currency: "HTG",
    bankName: "",
    accountName: "",
    accountNumber: "",
    amount: "",
  });

  const availableBalance =
    form.currency === "USD" ? usdAvailableBalance : htgAvailableBalance;
  const minAmount = MIN_AMOUNT[form.currency];

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // MonCash is HTG only — reset currency and amount if switching to moncash with USD selected
      if (
        key === "accountType" &&
        value === "moncash" &&
        prev.currency === "USD"
      ) {
        next.currency = "HTG";
        next.amount = "";
      }
      return next;
    });
  }

  function useMax() {
    setField("amount", String(availableBalance));
  }

  function handleClose(next: boolean) {
    setOpen(next);
    if (!next) {
      setForm({
        accountType: "bank",
        currency: "HTG",
        bankName: "",
        accountName: "",
        accountNumber: "",
        amount: "",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.error(t("error_invalid_amount"));
      return;
    }
    if (amount < minAmount) {
      toast.error(t("error_min_amount", { amount: minAmount.toLocaleString(), currency: form.currency }));
      return;
    }
    if (amount > availableBalance) {
      toast.error(t("error_insufficient"));
      return;
    }
    if (!form.accountName.trim() || !form.accountNumber.trim()) {
      toast.error(t("error_required_fields"));
      return;
    }
    if (form.accountType === "bank" && !form.bankName.trim()) {
      toast.error(t("error_bank_name"));
      return;
    }

    setIsLoading(true);
    const result = await CreateUserWithdrawalRequestAction(
      session?.user.accessToken ?? "",
      {
        accountType: form.accountType,
        currency: form.currency,
        bankName: form.accountType === "bank" ? form.bankName : undefined,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        amount,
      },
    );
    setIsLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    if (result.status === "failed") {
      if (result.message === "insufficient_balance") {
        toast.error(t("error_insufficient_balance"));
      } else {
        toast.error(t("error_failed"));
      }
      return;
    }
    toast.success(t("success"));
    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild className="flex justify-center w-full lg:w-fit ">
        <button className="flex items-center gap-2 px-[15px] py-[7px] rounded-[10rem] text-[1.4rem] leading-7 font-medium text-primary-500 border-2 border-primary-500 bg-primary-50 cursor-pointer">
          <ArrowUp size="16" color="#E45B00" variant="Bulk" />
          {t("trigger")}
        </button>
      </DialogTrigger>
      <DialogContent className="!w-[calc(100vw-2rem)] sm:!w-[560px] lg:!w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Payment method selector */}
          <div className="flex flex-col gap-3">
            <span className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
              {t("method_label")}
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(["bank", "moncash"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setField("accountType", type)}
                  className={`py-5 rounded-[14px] border-2 text-[1.5rem] font-medium leading-8 transition-colors ${
                    form.accountType === type
                      ? "border-primary-500 bg-primary-50 text-primary-500"
                      : "border-neutral-200 bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {type === "bank" ? tw("method_bank") : tw("method_moncash")}
                </button>
              ))}
            </div>
          </div>

          {/* Currency selector — bank only; MonCash is always HTG */}
          {form.accountType === "bank" && (
            <div className="flex flex-col gap-3">
              <span className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
                {t("currency_label")}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(["HTG", "USD"] as const).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => {
                      setField("currency", cur);
                      setField("amount", "");
                    }}
                    className={`py-5 rounded-[14px] border-2 text-[1.5rem] font-medium leading-8 transition-colors ${
                      form.currency === cur
                        ? "border-primary-500 bg-primary-50 text-primary-500"
                        : "border-neutral-200 bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bank name — only for bank */}
          {form.accountType === "bank" && (
            <div className="flex flex-col gap-2">
              <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
                {t("bank_name_label")}
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setField("bankName", e.target.value)}
                placeholder={t("bank_name_placeholder")}
                className="w-full bg-neutral-100 rounded-[1.2rem] px-6 py-[14px] text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 transition-colors"
              />
            </div>
          )}

          {/* Account name */}
          <div className="flex flex-col gap-2">
            <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
              {t("account_name_label")}
            </label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => setField("accountName", e.target.value)}
              placeholder={t("account_name_placeholder")}
              className="w-full bg-neutral-100 rounded-[1.2rem] px-6 py-[14px] text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Account number */}
          <div className="flex flex-col gap-2">
            <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
              {form.accountType === "bank"
                ? t("account_number_label_bank")
                : t("account_number_label_moncash")}
            </label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => setField("accountNumber", e.target.value)}
              placeholder={
                form.accountType === "bank"
                  ? t("account_number_placeholder_bank")
                  : t("account_number_placeholder_moncash")
              }
              className="w-full bg-neutral-100 rounded-[1.2rem] px-6 py-[14px] text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[1.3rem] leading-6 text-neutral-500 uppercase font-medium tracking-wide">
                {t("amount_label", { currency: form.currency })}
              </label>
              <button
                type="button"
                onClick={useMax}
                className="text-[1.3rem] leading-6 text-primary-500 font-medium"
              >
                {t("max", { balance: availableBalance.toLocaleString(), currency: form.currency })}
              </button>
            </div>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setField("amount", e.target.value)}
              min={minAmount}
              max={availableBalance}
              placeholder={t("amount_placeholder", { amount: minAmount.toLocaleString(), currency: form.currency })}
              className="w-full bg-neutral-100 rounded-[1.2rem] px-6 py-[14px] text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 transition-colors"
            />
            <span className="text-[1.2rem] leading-5 text-neutral-400 px-1">
              {t("min_notice", { amount: minAmount.toLocaleString(), currency: form.currency })}
            </span>
          </div>

          <div className="flex flex-row gap-3 mt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="flex-1 py-[12px] rounded-[10rem] text-[1.5rem] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 cursor-pointer"
              >
                {t("cancel")}
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-[12px] rounded-[10rem] text-[1.5rem] font-medium text-white bg-primary-500 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? t("submitting") : t("submit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
