import {
  Edit2,
  Headphone,
  Message,
  Note,
  SecurityUser,
  ShieldSecurity,
  Sms,
  WalletMoney,
  type Icon,
} from "iconsax-reactjs";

/**
 * The pages that live behind Settings (user decision, 2026-10-07): Figma's
 * sidebar keeps only Analytics, Users and Operations, so everything else is a
 * card on /settings. `badge` names the live counter shown on the card.
 */
export type SettingsLink = {
  key:
    | "support"
    | "contact"
    | "waitlist"
    | "kyc"
    | "admins"
    | "pending_edits"
    | "finance"
    | "emails";
  path: string;
  Icon: Icon;
  badge?: "liveThread" | "contact";
};

export const SETTINGS_LINKS: SettingsLink[] = [
  { key: "support", path: "/support", Icon: Headphone, badge: "liveThread" },
  { key: "contact", path: "/contact", Icon: Message, badge: "contact" },
  { key: "kyc", path: "/kyc", Icon: ShieldSecurity },
  { key: "pending_edits", path: "/activities/revisions", Icon: Edit2 },
  { key: "waitlist", path: "/waitlist", Icon: Note },
  { key: "finance", path: "/finance", Icon: WalletMoney },
  { key: "emails", path: "/emails", Icon: Sms },
  { key: "admins", path: "/admins", Icon: SecurityUser },
];

/** Paths that light up the Settings row (the hub and every page in it). */
export const SETTINGS_PATHS = ["/settings", ...SETTINGS_LINKS.map((l) => l.path)];
