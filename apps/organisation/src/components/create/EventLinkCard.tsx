"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { TickCircle, Warning2 } from "iconsax-reactjs";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Section } from "./CreateParts";
import { pillClass } from "./FormFields";

export type ProviderInfo = {
  /** Connected (and licensed / plan declared) — able to host right now. */
  ready: boolean;
  seatLimit: number | null;
  maxMinutes: number | null;
  /** The connected account, when known, e.g. an email. */
  account?: string | null;
};
export type OnlineProviders = { zoom: ProviderInfo; google_meet: ProviderInfo };
type Provider = "zoom" | "google_meet" | "custom";

/**
 * Figma's "Event Link" card for virtual events.
 *
 * Zoom and Google Meet keep Ticketwaze creating the meeting for the organiser
 * (one private link per buyer on Zoom, a calendar invite on Meet), so they
 * need a connected account; when it is missing the card says so and sends
 * them to connect. "Other link" takes the design's pasted URL and optional
 * password, shown only to ticket holders.
 */
export default function EventLinkCard({
  provider,
  onProviderChange,
  providers,
  linkProps,
  passwordProps,
  linkError,
  error,
}: {
  provider: Provider | "";
  onProviderChange: (value: Provider) => void;
  providers: OnlineProviders;
  linkProps: UseFormRegisterReturn;
  passwordProps: UseFormRegisterReturn;
  linkError?: string;
  /** A missing platform, or a hosted one that is not connected. */
  error?: string;
}) {
  const t = useTranslations("Events.create_event.event_link");
  const hosted = provider === "zoom" || provider === "google_meet" ? providers[provider] : null;

  return (
    <Section title={t("title")}>
      <div>
        <Select value={provider || undefined} onValueChange={(v) => onProviderChange(v as Provider)}>
          <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[6rem] shadow-none focus-visible:ring-0 focus-visible:border-primary-500 px-8 text-[1.5rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600">
            <SelectValue placeholder={t("platform_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zoom" className="text-[1.4rem] text-deep-100">
              Zoom
            </SelectItem>
            <SelectItem value="google_meet" className="text-[1.4rem] text-deep-100">
              Google Meet
            </SelectItem>
            <SelectItem value="custom" className="text-[1.4rem] text-deep-100">
              {t("other")}
            </SelectItem>
          </SelectContent>
        </Select>
        {error && <span className="block text-[1.2rem] px-8 pt-2 text-failure">{error}</span>}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {hosted && (
          <motion.div
            key={provider}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-4 rounded-[1.5rem] p-6 border ${hosted.ready ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/5"}`}
          >
            {hosted.ready ? (
              <TickCircle size="20" variant="Bulk" color="#349C2E" className="shrink-0 mt-1" />
            ) : (
              <Warning2 size="20" variant="Bulk" color="#E45B00" className="shrink-0 mt-1" />
            )}
            <div className="flex flex-col gap-3 text-[1.4rem] leading-8 text-deep-100">
              <p>
                {hosted.ready
                  ? hosted.account
                    ? t("ready_as", { account: hosted.account })
                    : t("ready")
                  : t(provider === "zoom" ? "connect_zoom_hint" : "connect_google_hint")}
              </p>
              {hosted.ready ? (
                <p className="text-[1.2rem] text-neutral-600">{t("auto_link_hint")}</p>
              ) : (
                <Link
                  href={`/events/create/meet?provider=${provider}`}
                  className="w-fit font-medium text-primary-500 underline underline-offset-4"
                >
                  {t("connect")}
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {provider === "custom" && (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div>
              <label className={pillClass}>
                <input
                  type="url"
                  inputMode="url"
                  placeholder={t("link_placeholder")}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] text-deep-200 placeholder:text-neutral-600"
                  {...linkProps}
                />
              </label>
              {linkError && (
                <span className="block text-[1.2rem] px-8 pt-2 text-failure">{linkError}</span>
              )}
            </div>
            <label className={pillClass}>
              <input
                type="text"
                autoComplete="off"
                placeholder={t("password_placeholder")}
                className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] text-deep-200 placeholder:text-neutral-600"
                {...passwordProps}
              />
            </label>
            <p className="text-[1.2rem] leading-6 text-neutral-600 px-4">{t("private_hint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
