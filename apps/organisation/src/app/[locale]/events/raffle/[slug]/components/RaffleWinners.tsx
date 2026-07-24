"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UpdateRafflePrizeClaim } from "@/actions/EventActions";
import type { RaffleWinner } from "@ticketwaze/typescript-config";

type ClaimStatus = "to_claim" | "claimed" | "unclaimed";

/**
 * The result of a completed draw. Ticketwaze never holds the prizes, so the
 * claim column is the organiser's own handover log, not something the platform
 * can verify — which is why every state is freely settable both ways.
 */
export default function RaffleWinners({
  organisationId,
  raffleId,
  winners,
}: {
  organisationId: string;
  raffleId: string;
  winners: RaffleWinner[];
}) {
  const t = useTranslations("Raffles.single_raffle.winners");
  const locale = useLocale();
  const { data: session } = useSession();

  const [claims, setClaims] = useState<Record<string, ClaimStatus>>(() =>
    Object.fromEntries(winners.map((w) => [w.rafflePrizeId, w.claimStatus])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  async function setClaim(prizeId: string, next: ClaimStatus) {
    const previous = claims[prizeId];
    // Optimistic: the toggle should feel instant, and a failure puts it back.
    setClaims((current) => ({ ...current, [prizeId]: next }));
    setSavingId(prizeId);
    const result = await UpdateRafflePrizeClaim(
      organisationId,
      raffleId,
      prizeId,
      next,
      session?.user.accessToken ?? "",
      locale,
    );
    setSavingId(null);
    if ("error" in result) {
      setClaims((current) => ({ ...current, [prizeId]: previous }));
      toast.error(result.error);
    }
  }

  if (winners.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full flex items-center justify-between">
        <span className="font-primary text-deep-100 font-medium text-[1.8rem] inline-flex items-center gap-2">
          <Crown size="22" color="#0d0d0d" variant="Bulk" />
          {t("title")}
        </span>
      </div>
      <Table className={"mt-4"}>
        <TableHeader>
          <TableRow>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("rank")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("prize")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("winner")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("entry")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase"
              }
            >
              {t("claim")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {winners.map((winner) => {
            const claim = claims[winner.rafflePrizeId] ?? "to_claim";
            return (
              <TableRow key={winner.rafflePrizeId}>
                <TableCell className={"py-6"}>
                  <span className="shrink-0 w-12 h-12 rounded-full bg-primary-50 text-primary-500 font-bold flex items-center justify-center text-[1.4rem]">
                    {winner.rank}
                  </span>
                </TableCell>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  {winner.prizeTitle}
                </TableCell>
                <TableCell
                  className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
                >
                  <span className="flex flex-col">
                    <span>{winner.fullName ?? "-"}</span>
                    <span className="text-[1.3rem] text-neutral-500 leading-6">
                      {winner.email ?? ""}
                    </span>
                  </span>
                </TableCell>
                <TableCell
                  className={
                    "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900 font-medium"
                  }
                >
                  {winner.ticketName ?? "-"}
                </TableCell>
                <TableCell className={"hidden lg:table-cell"}>
                  <select
                    value={claim}
                    disabled={savingId === winner.rafflePrizeId}
                    onChange={(e) =>
                      setClaim(
                        winner.rafflePrizeId,
                        e.target.value as ClaimStatus,
                      )
                    }
                    className="rounded-[30px] border border-neutral-300 bg-neutral-50 px-6 py-2 text-[1.3rem] leading-8 text-deep-100 outline-none focus:border-neutral-400 disabled:opacity-60"
                  >
                    <option value="to_claim">{t("status.to_claim")}</option>
                    <option value="claimed">{t("status.claimed")}</option>
                    <option value="unclaimed">{t("status.unclaimed")}</option>
                  </select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
