"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { LoginCurve, User } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type SignedInUser = {
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  hasOrganisation: boolean;
};

/**
 * The account corner of the navbar: Log in for a visitor, and one button with
 * their photo once signed in. It follows the page: on the Business page it
 * opens the organisation dashboard (whose onboarding takes someone without an
 * organisation through creating one); everywhere else, their profile in the
 * attendee app.
 *
 * The website never signs anyone in. It reads the session the attendee and
 * organisation apps share (see /api/session); Log in sends the visitor to the
 * attendee app, which signs them in for all three. Nothing renders while it is
 * still asking, so neither state flashes.
 *
 * Every link opens the app in a new tab, so the landing page stays where it
 * was. The session is re-read whenever the visitor comes back to this tab:
 * sign in or out over there, return here, and the navbar has already caught
 * up. (Tabs on different subdomains cannot message each other; the shared
 * cookie is what carries the change, so asking again on return is enough.)
 *
 * `compact` is the desktop navbar: round icon buttons the height of the
 * language switcher beside them, labelled by tooltip, so the landing page's
 * header stays light. The mobile menu has room for the words.
 */
export default function AccountLinks({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("HomePage.navbar");
  const locale = useLocale();
  const isBusinessPage = usePathname().startsWith("/business");
  // undefined while asking, null when signed out.
  const [user, setUser] = useState<SignedInUser | null | undefined>();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/session", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) setUser(data?.user ?? null);
        })
        .catch(() => {
          // A failed re-check keeps what is shown; only the first read
          // falls back to signed out.
          if (!cancelled)
            setUser((current) => (current === undefined ? null : current));
        });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", load);
    };
  }, []);

  if (user === undefined) return null;

  const loginUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/auth/login`;
  const accountUrl = isBusinessPage
    ? `${process.env.NEXT_PUBLIC_ORGANISATION_URL}/${locale}/analytics`
    : `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/profile`;
  const accountLabel = isBusinessPage ? t("dashboard") : t("profile");

  const avatar = user && (
    <Avatar user={user} size={compact ? "w-[45px] h-[45px]" : "w-10 h-10"} />
  );

  if (compact) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        {user === null ? (
          <IconLink href={loginUrl} label={t("login")}>
            <User
              size="20"
              variant="Bulk"
              className="transition-colors duration-300 stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500"
            />
          </IconLink>
        ) : (
          <IconLink href={accountUrl} label={accountLabel} bare>
            {avatar}
          </IconLink>
        )}
      </div>
    );
  }

  const pill =
    "px-6 py-[7.5px] rounded-[100px] flex items-center gap-3 text-[1.5rem] w-fit";

  if (user === null) {
    return (
      <a
        href={loginUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          pill,
          "border border-[#E45B00] bg-[#fee7d5] font-medium text-primary-500",
          className,
        )}
      >
        <LoginCurve size="18" color="#E45B00" variant="Bulk" />
        {t("login")}
      </a>
    );
  }

  return (
    <a
      href={accountUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        pill,
        "pl-2 border border-[#E45B00] bg-[#fee7d5] font-medium text-primary-500",
        className,
      )}
    >
      {avatar}
      {accountLabel}
    </a>
  );
}

/** A round navbar button, labelled for screen readers and by tooltip. */
function IconLink({
  href,
  label,
  bare = false,
  children,
}: {
  href: string;
  label: string;
  /** The child fills the circle itself (the avatar). */
  bare?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            "group w-[45px] h-[45px] rounded-full flex items-center justify-center transition-colors duration-300",
            bare
              ? "ring-2 ring-transparent hover:ring-primary-500"
              : "bg-gray-200 hover:bg-[#fee7d5]",
          )}
        >
          {children}
        </a>
      </TooltipTrigger>
      <TooltipContent sideOffset={6} className="text-[1.3rem]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function Avatar({ user, size }: { user: SignedInUser; size: string }) {
  // The URL comes from the session, which can be older than the photo, and a
  // replaced photo's file is deleted. A failed load falls back to the initial
  // rather than showing a broken image in the landing page's header.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (user.profileImageUrl && failedUrl !== user.profileImageUrl) {
    const url = user.profileImageUrl;
    return (
      // A plain <img>: photos come from the CDN or from Google, and a failure
      // has to be caught here rather than by next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        // Google-hosted photos can refuse requests that carry a referrer.
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(url)}
        className={cn(size, "rounded-full object-cover")}
      />
    );
  }
  const initial = (user.firstName || user.lastName || "?")[0].toUpperCase();
  return (
    <span
      className={cn(
        size,
        "rounded-full bg-primary-500 text-white flex items-center justify-center text-[1.4rem] font-medium",
      )}
    >
      {initial}
    </span>
  );
}
