"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { AddCircle, CloseCircle, Global } from "iconsax-reactjs";
import InstagramIcon from "@ticketwaze/ui/assets/icons/instagram.svg";
import TiktokIcon from "@ticketwaze/ui/assets/icons/tiktok.svg";
import TwitterIcon from "@ticketwaze/ui/assets/icons/twitter.svg";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SocialPlatform = "instagram" | "website" | "tiktok" | "twitter";
export type SocialLinks = Partial<Record<SocialPlatform, string>>;

const PLATFORMS: SocialPlatform[] = [
  "instagram",
  "website",
  "tiktok",
  "twitter",
];

/** What sits before the field, so only the handle (or address) is typed. */
const PREFIX: Record<SocialPlatform, string | null> = {
  instagram: "instagram.com/",
  tiktok: "tiktok.com/@",
  twitter: "x.com/",
  website: null,
};

/** A handle, or a pasted profile URL (the API keeps only the handle). */
export const SOCIAL_LINK_PATTERNS: Record<SocialPlatform, RegExp> = {
  instagram:
    /^(https?:\/\/)?(www\.)?(instagram\.com\/)?@?[a-z0-9._]{1,30}\/?([?#].*)?$/i,
  tiktok:
    /^(https?:\/\/)?(www\.)?(tiktok\.com\/)?@?[a-z0-9._]{2,24}\/?([?#].*)?$/i,
  twitter:
    /^(https?:\/\/)?(www\.)?((x|twitter)\.com\/)?@?[a-z0-9_]{1,15}\/?([?#].*)?$/i,
  website: /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i,
};

/**
 * The links' errors, keyed by platform, using the field's own messages
 * (`t` = "Auth.flow.setup.links"). A row added but left empty is fine: it is
 * simply not sent.
 */
export function validateSocialLinks(
  links: SocialLinks,
  t: (key: string) => string,
): Partial<Record<SocialPlatform, string>> {
  const errors: Partial<Record<SocialPlatform, string>> = {};
  for (const [platform, raw] of Object.entries(links) as [
    SocialPlatform,
    string,
  ][]) {
    const v = raw?.trim();
    if (v && !SOCIAL_LINK_PATTERNS[platform].test(v)) {
      errors[platform] = t(`errors.${platform}`);
    }
  }
  return errors;
}

function PlatformIcon({
  platform,
  size = 20,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  if (platform === "website")
    return <Global size={size} variant="Bulk" color="#E45B00" />;
  return (
    <Image
      src={
        platform === "instagram"
          ? InstagramIcon
          : platform === "twitter"
            ? TwitterIcon
            : TiktokIcon
      }
      alt=""
      width={size}
      height={size}
    />
  );
}

/**
 * Optional links on "Complete Account Set-up" and in Settings → Profile:
 * nothing shows until "+ Add link", which offers the platforms not added yet
 * (Instagram, Website, TikTok, X — any or all). Each added link is its own
 * removable row. `readOnly` (the profile before Edit) shows only the added
 * links, without the remove and add buttons.
 */
export default function SocialLinksField({
  value,
  onChange,
  errors,
  readOnly = false,
  emptyLabel,
}: {
  value: SocialLinks;
  onChange: (next: SocialLinks) => void;
  errors?: Partial<Record<SocialPlatform, string>>;
  readOnly?: boolean;
  /** Shown in read-only mode when no link was added. */
  emptyLabel?: string;
}) {
  const t = useTranslations("Auth.flow.setup.links");
  const [open, setOpen] = useState(false);
  const added = PLATFORMS.filter((p) => value[p] !== undefined);
  const remaining = PLATFORMS.filter((p) => value[p] === undefined);

  function add(platform: SocialPlatform) {
    onChange({ ...value, [platform]: "" });
    setOpen(false);
    // Focus the new row once it has rendered (the popover's own focus return
    // to "+ Add link" is cancelled in onCloseAutoFocus).
    setTimeout(
      () => document.getElementById(`social-link-${platform}`)?.focus(),
      50,
    );
  }

  function remove(platform: SocialPlatform) {
    const next = { ...value };
    delete next[platform];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {readOnly && added.length === 0 && emptyLabel && (
        <p className="text-[1.4rem] text-neutral-500 px-2">{emptyLabel}</p>
      )}
      <AnimatePresence initial={false}>
        {added.map((platform) => (
          <motion.div
            key={platform}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "flex items-center gap-3 bg-neutral-100 rounded-[5rem] pl-6 pr-4 h-[6rem] border transition-colors focus-within:border-primary-500",
                errors?.[platform] ? "border-failure" : "border-transparent",
              )}
            >
              <PlatformIcon platform={platform} />
              {/* Prefix and field read as one address: "instagram.com/name". */}
              <label
                htmlFor={`social-link-${platform}`}
                className="flex-1 min-w-0 flex items-center cursor-text"
              >
                {PREFIX[platform] && (
                  <span className="text-[1.5rem] text-neutral-500 whitespace-nowrap">
                    {PREFIX[platform]}
                  </span>
                )}
                <input
                  id={`social-link-${platform}`}
                  value={value[platform] ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [platform]: e.target.value })
                  }
                  placeholder={t(`placeholders.${platform}`)}
                  aria-label={t(`platforms.${platform}`)}
                  inputMode={platform === "website" ? "url" : "text"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={readOnly}
                  className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] text-deep-200 placeholder:text-neutral-400 disabled:text-neutral-500 disabled:cursor-not-allowed"
                />
              </label>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => remove(platform)}
                  aria-label={t("remove", {
                    platform: t(`platforms.${platform}`),
                  })}
                  className="text-neutral-500 hover:text-failure transition-colors shrink-0"
                >
                  <CloseCircle size={20} variant="Bulk" color="currentColor" />
                </button>
              )}
            </div>
            {errors?.[platform] && (
              <span className="text-[1.2rem] px-8 py-2 text-failure block">
                {errors[platform]}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {!readOnly && remaining.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="self-start flex items-center gap-2 px-2 text-[1.5rem] font-medium text-primary-500 hover:text-primary-600 transition-colors"
            >
              <AddCircle size={20} variant="Bulk" color="currentColor" />
              {t("add")}
              <span className="text-neutral-500 font-normal">
                · {t("optional")}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="w-[24rem] p-2 rounded-[1.5rem] bg-white border border-neutral-100 shadow-[0px_10px_30px_0px_rgba(0,0,0,0.08)]"
          >
            {remaining.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => add(platform)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-[1rem] text-[1.5rem] text-deep-100 hover:bg-neutral-100 transition-colors"
              >
                <PlatformIcon platform={platform} />
                {t(`platforms.${platform}`)}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
