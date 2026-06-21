"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import MoncashIcon from "@/assets/icons/moncash.svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CashoutToMoncashAction } from "@/actions/userActions";

export default function CashoutDialog({
  htgAvailableBalance,
}: {
  htgAvailableBalance: number;
}) {
  const t = useTranslations("Wallet");
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [moncashNumber, setMoncashNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!moncashNumber || numAmount <= 0) return;
    if (numAmount > htgAvailableBalance) {
      toast.error(t("cashout.insufficient_balance"));
      return;
    }

    startTransition(async () => {
      const result = await CashoutToMoncashAction(session!.user.accessToken, {
        amount: numAmount,
        moncashNumber,
      });
      if ("status" in result && result.status === "success") {
        toast.success(t("cashout.success"));
        setOpen(false);
        setMoncashNumber("");
        setAmount("");
      } else if (result.status === "failed" && result.message === "insufficient_balance") {
        toast.error(t("cashout.insufficient_balance"));
      } else {
        toast.error(t("cashout.error"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={
            "flex items-center gap-2 text-[1.4rem] leading-8 font-medium text-white bg-primary-500 px-6 py-3 rounded-[30px] hover:bg-primary-600 transition-colors"
          }
        >
          <Image src={MoncashIcon} alt="MonCash" width={20} height={20} />
          {t("cashout.trigger")}
        </button>
      </DialogTrigger>
      <DialogContent className={"w-[360px] lg:w-[480px]"}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-[2rem] text-[2.6rem] leading-[30px] text-black font-primary"
            }
          >
            {t("cashout.title")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            {t("cashout.title")}
          </DialogDescription>
        </DialogHeader>

        <div className={"flex flex-col gap-8 pt-4"}>
          <div
            className={
              "bg-neutral-50 rounded-[12px] p-6 flex flex-col gap-1"
            }
          >
            <span className={"text-[1.2rem] leading-6 text-neutral-500"}>
              {t("cashout.available_label")}
            </span>
            <span
              className={
                "font-primary font-medium text-[2.4rem] leading-[30px] text-black"
              }
            >
              {htgAvailableBalance.toLocaleString()}{" "}
              <span className={"text-neutral-400 text-[1.8rem]"}>HTG</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className={"flex flex-col gap-6"}>
            <div className={"flex flex-col gap-2"}>
              <label
                className={"text-[1.4rem] leading-8 font-medium text-neutral-700"}
              >
                {t("cashout.moncash_number_label")}
              </label>
              <input
                type="tel"
                value={moncashNumber}
                onChange={(e) => setMoncashNumber(e.target.value)}
                placeholder={t("cashout.moncash_number_placeholder")}
                required
                minLength={8}
                maxLength={15}
                className={
                  "w-full border border-neutral-200 rounded-[10px] px-5 py-4 text-[1.5rem] leading-8 outline-none focus:border-primary-500 transition-colors"
                }
              />
            </div>

            <div className={"flex flex-col gap-2"}>
              <label
                className={"text-[1.4rem] leading-8 font-medium text-neutral-700"}
              >
                {t("cashout.amount_label")}
              </label>
              <div className={"relative"}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  min={1}
                  max={htgAvailableBalance}
                  className={
                    "w-full border border-neutral-200 rounded-[10px] px-5 py-4 text-[1.5rem] leading-8 outline-none focus:border-primary-500 transition-colors pr-16"
                  }
                />
                <span
                  className={
                    "absolute right-5 top-1/2 -translate-y-1/2 text-[1.3rem] text-neutral-400 font-medium"
                  }
                >
                  HTG
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(htgAvailableBalance))}
                className={
                  "text-primary-500 text-[1.2rem] leading-6 text-left hover:underline w-fit"
                }
              >
                {t("cashout.use_max")}
              </button>
            </div>

            <p className={"text-[1.3rem] leading-6 text-neutral-500"}>
              {t("cashout.disclaimer")}
            </p>

            <button
              type="submit"
              disabled={isPending || !moncashNumber || !amount || Number(amount) <= 0}
              className={
                "w-full bg-primary-500 text-white font-medium text-[1.5rem] leading-8 py-4 rounded-[30px] hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              {isPending ? t("cashout.submitting") : t("cashout.submit")}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
