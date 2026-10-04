"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { MembershipTier } from "@ticketwaze/typescript-config";
import { useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateFooter,
  CreateHeader,
  Section,
} from "@/components/create/CreateParts";
import type { OnlineProviders } from "@/components/create/EventLinkCard";
import CreateInPersonEventForm from "../in-person/[eventType]/CreateInPersonEventForm";
import CreateMeetEventForm from "../meet/[eventType]/CreateMeetEventForm";

type Kind = "physical" | "virtual";

/**
 * Figma's Create Event: the Event Type select comes first, and the rest of
 * the form follows the choice. Physical and virtual events are still two
 * different wizards underneath (different fields, different API calls); this
 * hosts the select and swaps between them, carrying the category across.
 */
export default function CreateEventFlow({
  initialKind,
  category,
  provider,
  code,
  providers,
  membershipTier,
  paidTierName,
}: {
  initialKind: Kind | null;
  category: string;
  provider?: "zoom" | "google_meet" | "custom";
  code?: string;
  providers: OnlineProviders;
  membershipTier: MembershipTier;
  paidTierName: string | null;
}) {
  const t = useTranslations("Events.create_event");
  const router = useRouter();
  const [kind, setKind] = useState<Kind | null>(initialKind);
  const exit = () => router.push("/events/create");

  const typeCard = (
    <Section title={t("event_kind_title")}>
      <Select value={kind ?? undefined} onValueChange={(v) => setKind(v as Kind)}>
        <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[6rem] shadow-none focus-visible:ring-0 focus-visible:border-primary-500 px-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600">
          <SelectValue placeholder={t("event_type_placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="physical" className="text-[1.4rem] text-deep-100">
            {t("kind.physical")}
          </SelectItem>
          <SelectItem value="virtual" className="text-[1.4rem] text-deep-100">
            {t("kind.virtual")}
          </SelectItem>
        </SelectContent>
      </Select>
    </Section>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {kind === "physical" ? (
        <motion.div
          key="physical"
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CreateInPersonEventForm
            eventType={category}
            membershipTier={membershipTier}
            topSlot={typeCard}
            onExit={exit}
          />
        </motion.div>
      ) : kind === "virtual" ? (
        <motion.div
          key="virtual"
          className="h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CreateMeetEventForm
            eventType={category}
            code={code}
            providers={providers}
            initialProvider={provider}
            membershipTier={membershipTier}
            paidTierName={paidTierName}
            topSlot={typeCard}
            onExit={exit}
          />
        </motion.div>
      ) : (
        // Nothing chosen yet: just the select and a disabled Continue, as in
        // the design's first frame.
        <motion.div
          key="choose"
          className="relative flex flex-col gap-10 h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CreateHeader
            title={t("title_event")}
            steps={[t("basic"), t("date_time"), t("ticket")]}
            current={0}
            onBack={exit}
          />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              {typeCard}
            </motion.div>
          </div>
          <CreateFooter step={0} total={3} disabled />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
