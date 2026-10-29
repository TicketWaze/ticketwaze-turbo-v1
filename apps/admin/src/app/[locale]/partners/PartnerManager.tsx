"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight2, Copy, Key, TickCircle, Warning2 } from "iconsax-reactjs";
import {
  Badge,
  EmptyState,
  HEADER_PILL,
  PILL_TONE,
  RowMore,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
  TableFrame,
} from "@/components/shared/DataTable";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, TextArea } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useRouter } from "@/i18n/navigation";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";

export type ManagedPartner = {
  partnerId: string;
  slug: string;
  name: string;
  active: boolean;
  apiKeyPrefix: string;
  webhookUrl: string | null;
  hasWebhookSecret: boolean;
  returnOrigins: string[];
  payments: number;
  createdAt: string;
  updatedAt: string | null;
};

/** What the API answers once, right after making them. */
type Credentials = { apiKey?: string; webhookSecret?: string };

/** An answer of /admin/partners: the partner and, once, its credentials. */
type Answer = {
  status?: string;
  code?: string;
  partner: ManagedPartner;
  credentials?: Credentials;
};

type Confirm = "pause" | "resume" | "rotate-key" | "rotate-secret" | "delete";

/** The refusals the API names; anything else is the generic error. */
const KNOWN_CODES = [
  "SLUG_TAKEN",
  "WEBHOOK_NOT_HTTPS",
  "ORIGIN_NOT_HTTPS",
  "INVALID_URL",
  "INVALID_FIELDS",
  "PARTNER_HAS_PAYMENTS",
];

/**
 * Admin › Partners › Configuration — what `node ace partner:create` used to
 * do, on `partners.manage` (held out of every role bundle; see the API's
 * admin_roles). One row per partner; a row opens the drawer, where it is
 * edited, paused, re-keyed or deleted.
 *
 * The API key and the webhook secret are shown ONCE, in the dialog that
 * follows the action that made them: the key is stored hashed and the API
 * never serves the secret again. Losing them means regenerating.
 *
 * Pausing answers the partner's calls with 401 at once, without touching its
 * keys; payments already under way still complete and are still confirmed.
 * A partner that took any payment cannot be deleted, only paused — that
 * history is money collected on its behalf.
 */
export default function PartnerManager({ initial }: { initial: ManagedPartner[] }) {
  const t = useTranslations("PartnersList.manage");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const [partners, setPartners] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<"create" | "edit" | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = partners.find((p) => p.partnerId === selectedId) ?? null;

  /** One call to /admin/partners; null after a toast when it is refused. */
  async function call(method: string, path: string, body?: unknown) {
    setBusy(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/partners${path}`, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return (await response.json().catch(() => null)) as Answer | null;
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  }

  const refusal = (data: Answer | null) =>
    data?.code && KNOWN_CODES.includes(data.code) ? t(`errors.${data.code}`) : t("errors.generic");

  /** Keeps the list and the tiles above it (they read the server) in step. */
  function store(partner: ManagedPartner) {
    setPartners((list) => {
      const others = list.filter((p) => p.partnerId !== partner.partnerId);
      return [...others, partner].sort((a, b) => a.name.localeCompare(b.name));
    });
    router.refresh();
  }

  async function save(values: PartnerFormValues) {
    const creating = form === "create";
    const data = await call(
      creating ? "POST" : "PATCH",
      creating ? "" : `/${selected!.partnerId}`,
      creating
        ? values
        : { name: values.name, webhookUrl: values.webhookUrl, returnOrigins: values.returnOrigins },
    );
    if (data?.status !== "success") return refusal(data);
    store(data.partner);
    setForm(null);
    if (creating) {
      setSelectedId(data.partner.partnerId);
      setCredentials(data.credentials ?? null);
      toast.success(t("created", { name: data.partner.name }));
    } else {
      toast.success(t("saved"));
    }
    return null;
  }

  async function confirmAction() {
    if (!selected || !confirm) return;
    const id = selected.partnerId;
    const data =
      confirm === "pause" || confirm === "resume"
        ? await call("PATCH", `/${id}`, { active: confirm === "resume" })
        : confirm === "delete"
          ? await call("DELETE", `/${id}`)
          : await call("POST", `/${id}/${confirm}`);

    if (data?.status !== "success") {
      toast.error(refusal(data));
      return;
    }
    setConfirm(null);
    if (confirm === "delete") {
      setSelectedId(null);
      setPartners((list) => list.filter((p) => p.partnerId !== id));
      router.refresh();
      toast.success(t("deleted"));
      return;
    }
    store(data.partner);
    if (data.credentials) setCredentials(data.credentials);
    else toast.success(t(confirm === "pause" ? "paused" : "resumed"));
  }

  const detailRow = (label: string, value: React.ReactNode) => (
    <p className="flex justify-between items-start gap-8 text-[1.4rem] leading-8 text-neutral-600">
      <span className="shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0 break-all">{value}</span>
    </p>
  );

  const action = (label: string, onClick: () => void, tone?: "danger") => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-4 rounded-[1rem] px-5 py-4 text-[1.4rem] font-medium cursor-pointer transition-colors",
        tone === "danger"
          ? "bg-[#FFF1F1] hover:bg-[#FCE5EA] text-failure"
          : "bg-neutral-100 hover:bg-neutral-200 text-deep-100",
      )}
    >
      {label}
      <ArrowRight2 size="16" color={tone === "danger" ? "#D32F2F" : "#737C8A"} />
    </button>
  );

  return (
    <section className="flex flex-col gap-6 pt-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t("title")}
          </h4>
          <p className="text-[1.4rem] leading-7 text-neutral-600 max-w-[64rem]">{t("intro")}</p>
        </div>
        <button
          type="button"
          onClick={() => setForm("create")}
          className={cn(HEADER_PILL, PILL_TONE.primary, "flex-none")}
        >
          {t("new")}
        </button>
      </div>

      {partners.length === 0 ? (
        <EmptyState Icon={Key} text={t("empty")} />
      ) : (
        <TableFrame minWidth="72rem">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={TABLE_HEAD}>{t("columns.partner")}</th>
              <th className={TABLE_HEAD}>{t("columns.key")}</th>
              <th className={TABLE_HEAD}>{t("columns.webhook")}</th>
              <th className={TABLE_HEAD}>{t("columns.status")}</th>
              <th className={TABLE_HEAD}>
                <span className="sr-only">{t("columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr
                key={partner.partnerId}
                className={TABLE_ROW}
                onClick={() => setSelectedId(partner.partnerId)}
              >
                <td className={TABLE_CELL}>
                  <span className="flex flex-col">
                    <span className="font-medium">{partner.name}</span>
                    <span className="text-[1.2rem] leading-6 text-neutral-500">{partner.slug}</span>
                  </span>
                </td>
                <td className={cn(TABLE_CELL, "whitespace-nowrap font-mono text-[1.3rem]")}>
                  {partner.apiKeyPrefix}…
                </td>
                <td className={cn(TABLE_CELL, "max-w-[28rem]")}>
                  <span className="block truncate">{partner.webhookUrl ?? t("none")}</span>
                </td>
                <td className="py-6 pr-4">
                  <Badge tone={partner.active ? "success" : "warning"}>
                    {partner.active ? t("active") : t("paused_badge")}
                  </Badge>
                </td>
                <td className="py-6 text-right">
                  <RowMore />
                </td>
              </tr>
            ))}
          </tbody>
        </TableFrame>
      )}

      <Drawer
        direction="right"
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        {selected && (
          <DrawerContent className="my-8 p-12 rounded-[30px] w-full">
            <div className="w-full flex flex-col items-center overflow-y-auto">
              <DrawerTitle className="pb-12 max-w-full">
                <span className="block font-primary font-medium text-center text-[2.6rem] leading-12 text-black">
                  {selected.name}
                </span>
              </DrawerTitle>
              <DrawerDescription asChild className="w-full">
                <div className="flex flex-col gap-6">
                  {!selected.active && (
                    <p className="flex items-start gap-3 rounded-[1rem] bg-[#FFF7E6] px-5 py-4 text-[1.4rem] leading-7 text-[#B76E00]">
                      <Warning2 size="18" variant="Bulk" color="#B76E00" className="shrink-0 mt-1" />
                      {t("drawer.paused_alert")}
                    </p>
                  )}
                  {detailRow(t("fields.slug"), selected.slug)}
                  {detailRow(
                    t("columns.status"),
                    <Badge tone={selected.active ? "success" : "warning"}>
                      {selected.active ? t("active") : t("paused_badge")}
                    </Badge>,
                  )}
                  {detailRow(
                    t("columns.key"),
                    <span className="font-mono">{selected.apiKeyPrefix}…</span>,
                  )}
                  {detailRow(t("drawer.payments"), selected.payments)}
                  {detailRow(t("drawer.created"), formatDate(selected.createdAt, locale, "local"))}
                  <div className="h-[2px] w-full bg-neutral-100" />
                  {detailRow(t("fields.webhook"), selected.webhookUrl ?? t("none"))}
                  {detailRow(
                    t("fields.origins"),
                    selected.returnOrigins.length ? (
                      <span className="flex flex-col items-end">
                        {selected.returnOrigins.map((origin) => (
                          <span key={origin}>{origin}</span>
                        ))}
                      </span>
                    ) : (
                      t("none")
                    ),
                  )}
                  {!selected.webhookUrl && (
                    <p className="text-[1.3rem] leading-6 text-[#B76E00]">{t("drawer.no_webhook")}</p>
                  )}
                  <div className="h-[2px] w-full bg-neutral-100" />
                  <div className="flex flex-col gap-3">
                    {action(t("drawer.edit"), () => setForm("edit"))}
                    {action(t("drawer.rotate_key"), () => setConfirm("rotate-key"))}
                    {action(t("drawer.rotate_secret"), () => setConfirm("rotate-secret"))}
                    {selected.active
                      ? action(t("drawer.pause"), () => setConfirm("pause"), "danger")
                      : action(t("drawer.resume"), () => setConfirm("resume"))}
                  </div>
                  {selected.payments > 0 && (
                    <p className="text-[1.3rem] leading-6 text-neutral-500">
                      {t("drawer.cannot_delete")}
                    </p>
                  )}
                </div>
              </DrawerDescription>
            </div>
            <DrawerFooter>
              <div className="flex gap-4 w-full">
                <DrawerClose asChild>
                  <button
                    type="button"
                    className={cn(HEADER_PILL, PILL_TONE.neutral, "flex-1 lg:flex-1 h-[4.8rem]")}
                  >
                    {t("drawer.close")}
                  </button>
                </DrawerClose>
                {selected.payments === 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirm("delete")}
                    className={cn(HEADER_PILL, PILL_TONE.danger, "flex-1 lg:flex-1 h-[4.8rem]")}
                  >
                    {t("drawer.delete")}
                  </button>
                )}
              </div>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>

      {form && (
        <PartnerFormDialog
          key={form === "edit" ? selected?.partnerId : "create"}
          partner={form === "edit" ? selected : null}
          busy={busy}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <DialogContent>
          {confirm && selected && (
            <>
              <DialogTitle>{t(`confirm.${confirm}.title`)}</DialogTitle>
              <DialogDescription className="text-[1.5rem] text-neutral-600 leading-8">
                {t(`confirm.${confirm}.body`, { name: selected.name })}
              </DialogDescription>
              <DialogFooter className="mt-2 flex gap-4">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className={cn(HEADER_PILL, PILL_TONE.neutral)}
                >
                  {t("confirm.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmAction}
                  disabled={busy}
                  className={cn(
                    HEADER_PILL,
                    "text-white text-[1.4rem] min-w-[14rem]",
                    confirm === "resume"
                      ? "bg-primary-500 hover:bg-primary-600"
                      : "bg-failure hover:bg-failure/90",
                  )}
                >
                  {busy ? <LoadingCircleSmall /> : t(`confirm.${confirm}.action`)}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CredentialsDialog
        credentials={credentials}
        partnerName={selected?.name ?? ""}
        onClose={() => setCredentials(null)}
      />
    </section>
  );
}

type PartnerFormValues = {
  slug: string;
  name: string;
  webhookUrl: string | null;
  returnOrigins: string[];
};

/** "BTI Admission" → "bti-admission", what the slug field starts from. */
const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

/**
 * Register a partner, or edit one. The slug is fixed once created: it names
 * the partner in filters and in `ace partner:create`. Return origins are one
 * per line; the API keeps only `scheme://host[:port]` of each.
 */
function PartnerFormDialog({
  partner,
  busy,
  onClose,
  onSave,
}: {
  partner: ManagedPartner | null;
  busy: boolean;
  onClose: () => void;
  /** Answers the error to show, or null when saved. */
  onSave: (values: PartnerFormValues) => Promise<string | null>;
}) {
  const t = useTranslations("PartnersList.manage");
  const [name, setName] = useState(partner?.name ?? "");
  const [slug, setSlug] = useState(partner?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [webhook, setWebhook] = useState(partner?.webhookUrl ?? "");
  const [origins, setOrigins] = useState((partner?.returnOrigins ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 2 || (!partner && !/^[a-z0-9-]{2,40}$/.test(slug))) {
      setError(t("errors.INVALID_FIELDS"));
      return;
    }
    setError(
      await onSave({
        slug,
        name: name.trim(),
        webhookUrl: webhook.trim() || null,
        returnOrigins: origins
          .split(/[\s,]+/)
          .map((o) => o.trim())
          .filter(Boolean),
      }),
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogTitle className="font-primary font-medium text-[2.4rem] leading-12 text-black pr-12">
          {partner ? t("form.edit_title") : t("form.create_title")}
        </DialogTitle>
        <DialogDescription className="text-[1.4rem] leading-8 text-neutral-600 -mt-2">
          {partner ? t("form.edit_description") : t("form.create_description")}
        </DialogDescription>
        <form onSubmit={submit} noValidate className="flex flex-col gap-6 pt-4">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!partner && !slugTouched) setSlug(slugify(e.target.value));
              setError(null);
            }}
            autoComplete="off"
            autoFocus
          >
            {t("fields.name")}
          </Input>
          {!partner && (
            <div className="flex flex-col gap-2">
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  setSlugTouched(true);
                  setError(null);
                }}
                autoCapitalize="none"
                autoComplete="off"
              >
                {t("fields.slug")}
              </Input>
              <span className="px-8 text-[1.2rem] leading-6 text-neutral-500">
                {t("fields.slug_hint")}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Input
              type="url"
              value={webhook}
              onChange={(e) => {
                setWebhook(e.target.value);
                setError(null);
              }}
              autoCapitalize="none"
              autoComplete="off"
            >
              {t("fields.webhook")}
            </Input>
            <span className="px-8 text-[1.2rem] leading-6 text-neutral-500">
              {t("fields.webhook_hint")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <label className="px-2 text-[1.3rem] font-medium text-deep-100">
              {t("fields.origins")}
            </label>
            <TextArea
              value={origins}
              onChange={(e) => {
                setOrigins(e.target.value);
                setError(null);
              }}
              textareaClassName="min-h-[12rem] pt-6 font-mono text-[1.3rem]"
              autoCapitalize="none"
              spellCheck={false}
            >
              {null}
            </TextArea>
            <span className="px-8 text-[1.2rem] leading-6 text-neutral-500">
              {t("fields.origins_hint")}
            </span>
          </div>
          {error && (
            <p className="rounded-[1rem] bg-[#FFF1F1] px-5 py-4 text-[1.4rem] leading-7 text-failure">
              {error}
            </p>
          )}
          <ButtonPrimary type="submit" disabled={busy} className="w-full h-[5.6rem]">
            {busy ? <LoadingCircleSmall /> : partner ? t("form.save") : t("form.create")}
          </ButtonPrimary>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The one time a key or secret is readable. Closing needs the button: a click
 * beside the card or Escape would lose them for good.
 */
function CredentialsDialog({
  credentials,
  partnerName,
  onClose,
}: {
  credentials: Credentials | null;
  partnerName: string;
  onClose: () => void;
}) {
  const t = useTranslations("PartnersList.manage.credentials");
  const [copied, setCopied] = useState<string | null>(null);

  const lines = [
    credentials?.apiKey && { label: t("key"), env: "TICKETWAZE_PAY_KEY", value: credentials.apiKey },
    credentials?.webhookSecret && {
      label: t("secret"),
      env: "TICKETWAZE_PAY_WEBHOOK_SECRET",
      value: credentials.webhookSecret,
    },
  ].filter(Boolean) as { label: string; env: string; value: string }[];

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
    } catch {
      toast.error(t("copy_failed"));
    }
  }

  return (
    <Dialog open={credentials !== null}>
      <DialogContent
        className="[&>[data-slot=dialog-close]]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="font-primary font-medium text-[2.4rem] leading-12 text-black">
          {t("title", { name: partnerName })}
        </DialogTitle>
        <DialogDescription asChild>
          <p className="flex items-start gap-3 rounded-[1rem] bg-[#FFF7E6] px-5 py-4 text-[1.4rem] leading-7 text-[#B76E00]">
            <Warning2 size="18" variant="Bulk" color="#B76E00" className="shrink-0 mt-1" />
            {t("warning")}
          </p>
        </DialogDescription>
        <div className="flex flex-col gap-5 pt-2">
          {lines.map((line) => (
            <div key={line.env} className="flex flex-col gap-2">
              <span className="text-[1.3rem] font-medium text-deep-100">{line.label}</span>
              <div className="flex items-center gap-3 rounded-[1rem] bg-neutral-100 pl-5 pr-2 py-2">
                <code className="flex-1 min-w-0 break-all font-mono text-[1.3rem] leading-7 text-deep-100">
                  {line.env}={line.value}
                </code>
                <button
                  type="button"
                  onClick={() => copy(line.env, `${line.env}=${line.value}`)}
                  aria-label={t("copy")}
                  className="w-[3.6rem] h-[3.6rem] shrink-0 rounded-full bg-white flex items-center justify-center cursor-pointer hover:bg-neutral-200 transition-colors"
                >
                  {copied === line.env ? (
                    <TickCircle size="18" variant="Bulk" color="#1E8E4E" />
                  ) : (
                    <Copy size="18" variant="Bulk" color="#454A53" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {lines.length > 1 && (
            <button
              type="button"
              onClick={() => copy("all", lines.map((l) => `${l.env}=${l.value}`).join("\n"))}
              className={cn(HEADER_PILL, PILL_TONE.neutral, "self-start")}
            >
              {copied === "all" ? t("copied") : t("copy_all")}
            </button>
          )}
          <p className="text-[1.3rem] leading-6 text-neutral-600">{t("where")}</p>
        </div>
        <ButtonPrimary
          type="button"
          className="w-full h-[5.6rem] mt-2"
          onClick={() => {
            setCopied(null);
            onClose();
          }}
        >
          {t("done")}
        </ButtonPrimary>
      </DialogContent>
    </Dialog>
  );
}
