"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sms } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import { Badge, HEADER_PILL, PILL_TONE } from "@/components/shared/DataTable";
import { cn } from "@/lib/utils";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";

export type InvitationRecord = {
  invitationId: string;
  email: string;
  role: number;
  invitedBy: string | null;
  expiresAt: string;
  lastSentAt: string;
  createdAt: string;
};

/** The roles an invitation can carry (never Owner, never Pending). */
const INVITE_ROLES = [1, 2, 3, 4];

const EMAIL_PATTERN = /^[^\s@]+@ticketwaze\.com$/i;

/**
 * Administrators › invitations — the only way a new admin gets in. The
 * invitee gets a link to /auth/join (valid 7 days, works once). Sending is
 * capped on the API (10 min between sends to one address, 5 a day each,
 * 30 a day in total); a refusal says how long to wait.
 */
export default function Invitations({
  initialInvitations,
  canInvite,
}: {
  initialInvitations: InvitationRecord[];
  canInvite: boolean;
}) {
  const t = useTranslations("Admins.invitations");
  const tRoles = useTranslations("Admins.roles");
  const locale = useLocale();
  const { data: session } = useSession();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("2");
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function call(method: string, path: string, body?: unknown) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator/invitations${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    ).catch(() => null);
    return (await response?.json().catch(() => null)) as Record<string, any> | null;
  }

  /** The message for a refusal, with the wait when the email budget is spent. */
  function refusal(data: Record<string, any> | null) {
    const code = data?.code;
    if (code === "ADMIN_EXISTS") return t("errors.exists");
    if (code === "ALREADY_INVITED") return t("errors.already");
    if (code === "INVITE_COOLDOWN" || code === "INVITE_DAILY" || code === "INVITES_DAILY") {
      const minutes = Math.max(1, Math.ceil(Number(data?.retryAfterSeconds ?? 60) / 60));
      return t(code === "INVITES_DAILY" ? "errors.daily_total" : "errors.wait", { minutes });
    }
    return t("errors.generic");
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setEmailError(t("errors.domain"));
      return;
    }
    setSending(true);
    const data = await call("POST", "", { email: address, role: Number(role) });
    setSending(false);
    if (data?.status === "success") {
      setInvitations((list) => [data.invitation, ...list]);
      toast.success(t("sent", { email: address }));
      setOpen(false);
      setEmail("");
      setRole("2");
      return;
    }
    if (data?.code === "ADMIN_EXISTS" || data?.code === "ALREADY_INVITED") {
      setEmailError(refusal(data));
    } else {
      toast.error(refusal(data));
    }
  }

  async function resend(invitation: InvitationRecord) {
    setBusyId(invitation.invitationId);
    const data = await call("POST", `/${invitation.invitationId}/resend`);
    setBusyId(null);
    if (data?.status === "success") {
      setInvitations((list) =>
        list.map((i) => (i.invitationId === invitation.invitationId ? data.invitation : i)),
      );
      toast.success(t("resent", { email: invitation.email }));
    } else {
      toast.error(refusal(data));
    }
  }

  async function revoke(invitation: InvitationRecord) {
    setBusyId(invitation.invitationId);
    const data = await call("DELETE", `/${invitation.invitationId}`);
    setBusyId(null);
    if (data?.status === "success") {
      setInvitations((list) =>
        list.filter((i) => i.invitationId !== invitation.invitationId),
      );
      toast.success(t("revoked"));
    } else {
      toast.error(t("errors.generic"));
    }
  }

  const roleLabel = (value: number) => (tRoles.has(String(value)) ? tRoles(String(value)) : "—");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
          {t("title")}
          {invitations.length > 0 && (
            <span className="ml-3 text-neutral-500">{invitations.length}</span>
          )}
        </h4>
        {canInvite && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(HEADER_PILL, PILL_TONE.primary, "flex-none")}
          >
            {t("invite")}
          </button>
        )}
      </div>

      {invitations.length === 0 ? (
        <p className="text-[1.4rem] text-neutral-600">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-100 border border-neutral-100 rounded-[1.5rem]">
          {invitations.map((invitation) => (
            <li
              key={invitation.invitationId}
              className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between px-6 py-5"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-[3.8rem] h-[3.8rem] rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                  <Sms size={18} variant="Bulk" color="#E45B00" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-[1.5rem] font-medium text-deep-100 truncate">
                      {invitation.email}
                    </span>
                    <Badge>{roleLabel(invitation.role)}</Badge>
                  </span>
                  {/* "expires …" now starts the line, so it gets a capital. */}
                  <span className="text-[1.3rem] text-neutral-600 first-letter:uppercase">
                    {t("expires", {
                      date: formatDate(invitation.expiresAt, locale, "local"),
                    })}
                    {invitation.invitedBy && ` · ${t("by", { email: invitation.invitedBy })}`}
                  </span>
                </div>
              </div>
              {canInvite && (
                <div className="flex items-center gap-3 shrink-0">
                  {busyId === invitation.invitationId ? (
                    <LoadingCircleSmall />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => resend(invitation)}
                        className={cn(HEADER_PILL, PILL_TONE.neutral)}
                      >
                        {t("resend")}
                      </button>
                      <button
                        type="button"
                        onClick={() => revoke(invitation)}
                        className={cn(HEADER_PILL, PILL_TONE.danger)}
                      >
                        {t("revoke")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={(next) => !sending && setOpen(next)}>
        <DialogContent>
          <DialogTitle className="font-primary font-medium text-[2.4rem] leading-12 text-black pr-12">
            {t("invite")}
          </DialogTitle>
          <DialogDescription className="text-[1.4rem] leading-8 text-neutral-600 -mt-2">
            {t("description")}
          </DialogDescription>
          <form onSubmit={invite} noValidate className="flex flex-col gap-6 pt-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              autoCapitalize="none"
              autoComplete="off"
              error={emailError}
              autoFocus
            >
              {t("email")}
            </Input>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                aria-label={t("role")}
                className="bg-neutral-100 w-full rounded-[3rem] !h-[6rem] px-8 border-none text-[1.5rem] text-neutral-700 cursor-pointer"
              >
                <SelectValue placeholder={t("role")} />
              </SelectTrigger>
              <SelectContent className="bg-white text-[1.4rem]">
                <SelectGroup>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem
                      key={r}
                      value={String(r)}
                      className="text-[1.4rem] text-deep-100 py-3"
                    >
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ButtonPrimary type="submit" disabled={sending} className="w-full h-[5.6rem]">
              {sending ? <LoadingCircleSmall /> : t("send")}
            </ButtonPrimary>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
