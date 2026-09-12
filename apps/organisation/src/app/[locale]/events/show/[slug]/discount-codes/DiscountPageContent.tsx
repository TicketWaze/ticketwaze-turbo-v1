"use client";
import { useMemo } from "react";
import { Add } from "iconsax-reactjs";
import { Event } from "@ticketwaze/typescript-config";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import DiscountCodeTable from "./DiscountCodeTable";
import DiscountDrawerContent from "./DiscountDrawerContent";

export default function DiscountPageContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.discount");
  const codes = event.discountCodes ?? [];

  /**
   * ACTIVE MEANS USABLE, not merely "not switched off".
   *
   * The tabs used to filter on `isActive` alone, which put expired codes and
   * codes that had hit their usage limit in the Active tab — where an
   * organiser reading the screen would reasonably conclude they still work.
   * A buyer trying one gets refused, and the dashboard gave no hint why.
   */
  const { active, inactive } = useMemo(() => {
    const now = Date.now();
    const usable = (code: (typeof codes)[number]) =>
      code.isActive &&
      new Date(code.expiresAt).getTime() > now &&
      (code.usageLimit === null ||
        Number(code.usageCount) < Number(code.usageLimit));

    return {
      active: codes.filter(usable),
      inactive: codes.filter((code) => !usable(code)),
    };
  }, [codes]);

  return (
    <div className="flex flex-col h-full gap-8">
      <TopBar title={t("subtitle")}>
        <Drawer direction="right">
          <DrawerTrigger asChild className="w-full hidden lg:flex">
            <ButtonPrimary>{t("title")}</ButtonPrimary>
          </DrawerTrigger>
          <DiscountDrawerContent event={event} />
        </Drawer>
      </TopBar>

      {/* Mobile: the same drawer behind a floating action button. */}
      <Drawer direction="right">
        <DrawerTrigger asChild className="lg:hidden absolute bottom-43 right-10">
          <button
            aria-label={t("title")}
            className="lg:hidden absolute bottom-43 right-10 w-[60px] h-[60px] bg-primary-500 rounded-full flex items-center justify-center"
          >
            <Add size="32" color="#ffffff" />
          </button>
        </DrawerTrigger>
        <DiscountDrawerContent event={event} />
      </Drawer>

      <div className="h-full">
        <Tabs defaultValue="all" className="w-full h-full">
          <div className="flex justify-between">
            <TabsList className="w-full lg:max-w-[318px] lg:w-auto mx-auto lg:mx-0">
              <TabsTrigger value="all">{t("all")}</TabsTrigger>
              <TabsTrigger value="active">{t("active")}</TabsTrigger>
              <TabsTrigger value="inactive">{t("inactive")}</TabsTrigger>
            </TabsList>
            <div />
          </div>

          <TabsContent value="all" className="w-full h-full">
            <DiscountCodeTable
              activityId={event.eventId}
              codes={codes}
              currency={event.currency}
              emptyMessage={t("empty")}
            />
          </TabsContent>
          <TabsContent value="active" className="w-full h-full">
            <DiscountCodeTable
              activityId={event.eventId}
              codes={active}
              currency={event.currency}
              emptyMessage={t("empty_active")}
            />
          </TabsContent>
          <TabsContent value="inactive" className="w-full h-full">
            <DiscountCodeTable
              activityId={event.eventId}
              codes={inactive}
              currency={event.currency}
              emptyMessage={t("empty_inactive")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
