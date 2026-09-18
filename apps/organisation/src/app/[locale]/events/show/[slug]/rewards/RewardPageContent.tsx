"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CloseCircle,
  Gift,
  TickCircle,
  Trash,
  Warning2,
} from "iconsax-reactjs";
import type {
  ActivityReward,
  RewardGrant,
} from "@ticketwaze/typescript-config";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { ButtonPrimary } from "@/components/shared/buttons";
import TopBar from "@/components/shared/TopBar";
import { usePathname } from "@/i18n/navigation";
import { DeleteReward, SetRewardActive } from "@/actions/RewardActions";
import RewardDrawerContent from "./RewardDrawerContent";
import RewardGrantsTable from "./RewardGrantsTable";

/**
 * ONE REWARD PER ACTIVITY, so this screen is a single record rather than a
 * list: the reward's terms, how many have gone out, and who earned them.
 */
export default function RewardPageContent({
  activityId,
  reward,
  grants,
  canCreate,
}: {
  activityId: string;
  reward: ActivityReward | null;
  grants: RewardGrant[];
  canCreate: boolean;
}) {
  const t = useTranslations("Events.single_event.rewards");
  const locale = useLocale();
  const pathname = usePathname();
  const [isBusy, setIsBusy] = useState(false);

  async function setActive(isActive: boolean) {
    if (!reward) return;
    setIsBusy(true);
    const result = await SetRewardActive(
      activityId,
      reward.rewardId,
      isActive,
      pathname,
      locale,
    );
    setIsBusy(false);
    if (result.error) return toast.error(result.error);
    toast.success(isActive ? t("activated") : t("deactivated"));
  }

  async function remove() {
    if (!reward) return;
    setIsBusy(true);
    const result = await DeleteReward(
      activityId,
      reward.rewardId,
      pathname,
      locale,
    );
    setIsBusy(false);
    if (result.error) return toast.error(result.error);
    /**
     * A reward already given to buyers is switched off rather than deleted —
     * its grants explain why those people hold a ticket they never paid for.
     * The API says which happened, and the organiser is told rather than left
     * wondering why the card is still there.
     */
    toast.success(
      result.deleted ? t("deleted") : (result.message ?? t("deactivated")),
    );
  }

  const statClass =
    "flex flex-col gap-1 rounded-[20px] bg-neutral-100 px-[2rem] py-[1.6rem] flex-1 min-w-[140px]";
  const statLabel = "text-[1.2rem] leading-6 text-neutral-600 uppercase";
  const statValue = "text-[2rem] leading-10 text-deep-100 font-medium";

  return (
    <div className="flex flex-col h-full gap-8">
      <TopBar title={t("subtitle")}>
        {reward === null && canCreate && (
          <Drawer direction="right">
            <DrawerTrigger asChild className="w-full hidden lg:flex">
              <ButtonPrimary>{t("create")}</ButtonPrimary>
            </DrawerTrigger>
            <RewardDrawerContent activityId={activityId} reward={null} />
          </Drawer>
        )}
      </TopBar>

      <p className="text-[1.5rem] leading-8 text-neutral-700">{t("intro")}</p>

      {/*
        WHO PAYS FOR THIS, said before the organiser commits to it. A reward
        ticket is the organisation's own gift: it adds nothing to the proceeds
        and it still occupies a place at the activity.
      */}
      <div className="flex items-start gap-3 rounded-[15px] bg-[#FFF7ED] border border-[#FDBA74] px-[1.5rem] py-[1.2rem]">
        <Warning2
          size="18"
          color="#ea961c"
          variant="TwoTone"
          className="shrink-0 mt-[2px]"
        />
        <p className="text-[1.3rem] leading-7 text-[#9a5b00]">
          {t("cost_notice")}
        </p>
      </div>

      {reward === null ? (
        <div className="flex flex-col items-center justify-center gap-6 py-[6rem]">
          <Gift size="48" variant="Bulk" color="#FF8A65" />
          <span className="text-[1.5rem] text-neutral-600 text-center max-w-[420px]">
            {canCreate ? t("empty") : t("free_event_notice")}
          </span>
          {canCreate && (
            <Drawer direction="right">
              <DrawerTrigger asChild>
                <ButtonPrimary>{t("create")}</ButtonPrimary>
              </DrawerTrigger>
              <RewardDrawerContent activityId={activityId} reward={null} />
            </Drawer>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 rounded-[30px] border border-neutral-200 p-[2.5rem]">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="flex flex-col gap-2">
                <span className="font-primary font-medium text-[2.6rem] leading-[34px] text-black">
                  {reward.name}
                </span>
                <span className="text-[1.5rem] leading-8 text-neutral-700">
                  {t("rule", {
                    quantity: reward.requiredQuantity,
                    name: reward.name,
                  })}
                </span>
              </div>
              <span
                className={`text-[1.2rem] uppercase tracking-[0.04em] rounded-[5rem] px-6 py-2 ${
                  reward.isActive
                    ? "bg-[#E7F7EE] text-success"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {reward.isActive ? t("active") : t("inactive")}
              </span>
            </div>

            <div className="flex gap-4 flex-wrap">
              <div className={statClass}>
                <span className={statLabel}>{t("given_out")}</span>
                <span className={statValue}>{reward.grantedCount}</span>
              </div>
              <div className={statClass}>
                <span className={statLabel}>{t("remaining")}</span>
                {/* Null stock is unlimited, and 0 remaining is a real number —
                    so this branches on null rather than on falsiness. */}
                <span className={statValue}>
                  {reward.remaining === null
                    ? t("unlimited_stock")
                    : reward.remaining}
                </span>
              </div>
              <div className={statClass}>
                <span className={statLabel}>{t("required_quantity")}</span>
                <span className={statValue}>{reward.requiredQuantity}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <Drawer direction="right">
                <DrawerTrigger asChild>
                  <ButtonPrimary className="px-[3rem]">
                    {t("edit")}
                  </ButtonPrimary>
                </DrawerTrigger>
                <RewardDrawerContent activityId={activityId} reward={reward} />
              </Drawer>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => setActive(!reward.isActive)}
                className="flex items-center gap-3 text-[1.4rem] text-deep-100 cursor-pointer disabled:opacity-50"
              >
                {reward.isActive ? (
                  <>
                    <CloseCircle size="18" color="#d92d20" />
                    {t("deactivate")}
                  </>
                ) : (
                  <>
                    <TickCircle size="18" color="#1F9D55" />
                    {t("activate")}
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={remove}
                className="flex items-center gap-3 text-[1.4rem] text-failure cursor-pointer disabled:opacity-50"
              >
                <Trash size="18" color="#d92d20" />
                {t("delete")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="font-medium text-[1.8rem] leading-8 text-deep-100">
              {t("grants_title")}
            </span>
            <RewardGrantsTable grants={grants} />
          </div>
        </div>
      )}
    </div>
  );
}
